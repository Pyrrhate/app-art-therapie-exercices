import type { ImagePickerAsset } from "expo-image-picker";
import type { ImagePickerOptions } from "expo-image-picker";
import {
  assertSourceSize,
  type CompressTarget,
  formatImageSize,
  getImageByteSize,
  getImagePickerOptionsWeb,
  ImageCloudFileError,
  ImageCompressionError,
  ImageProcessingAbortedError,
  ImageReadTimeoutError,
  ImageTooLargeError,
  PREVIEW_MAX_BYTES,
  PREVIEW_MAX_WIDTH,
  type PreparedImage,
  throwIfAborted,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_WIDTH,
  UPLOAD_MIN_WIDTH,
  yieldToUi,
} from "./image.shared";

export * from "./image.shared";

const FILE_PICKER_FOCUS_GRACE_MS = 500;

const UPLOAD_TARGET: CompressTarget = {
  maxBytes: UPLOAD_MAX_BYTES,
  maxWidth: UPLOAD_MAX_WIDTH,
  minWidth: UPLOAD_MIN_WIDTH,
};

export function getImagePickerOptions(): ImagePickerOptions {
  return getImagePickerOptionsWeb();
}

function readTimeoutMs(fileSize: number): number {
  const mb = fileSize / (1024 * 1024);
  return Math.min(45_000, Math.max(12_000, 10_000 + mb * 6_000));
}

function decodeTimeoutMs(fileSize: number): number {
  const mb = fileSize / (1024 * 1024);
  return Math.min(60_000, Math.max(15_000, 12_000 + mb * 8_000));
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => Error,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ImageProcessingAbortedError());
      return;
    }

    const timer = setTimeout(() => reject(onTimeout()), ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new ImageProcessingAbortedError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    promise
      .then((value) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      });
  });
}

async function readFileAsBlob(
  file: File,
  signal?: AbortSignal
): Promise<Blob> {
  throwIfAborted(signal);

  if (!file.size) {
    throw new ImageCloudFileError();
  }

  assertSourceSize(file.size);

  const buffer = await withTimeout(
    file.arrayBuffer(),
    readTimeoutMs(file.size),
    () => new ImageReadTimeoutError(),
    signal
  );

  throwIfAborted(signal);

  if (!buffer.byteLength) {
    throw new ImageCloudFileError();
  }

  return new Blob([buffer], {
    type: file.type || "image/jpeg",
  });
}

type DrawableSource = ImageBitmap | HTMLImageElement;

function sourceDimensions(source: DrawableSource): { width: number; height: number } {
  return { width: source.width, height: source.height };
}

function releaseSource(source: DrawableSource) {
  if (source instanceof ImageBitmap) {
    source.close();
  } else {
    source.src = "";
  }
}

async function decodeBlob(
  blob: Blob,
  initialMaxWidth: number,
  signal?: AbortSignal
): Promise<DrawableSource> {
  throwIfAborted(signal);

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await withTimeout(
        createImageBitmap(blob, {
          resizeWidth: initialMaxWidth,
          resizeQuality: "medium",
        }),
        decodeTimeoutMs(blob.size),
        () => new ImageReadTimeoutError(),
        signal
      );
      return bitmap;
    } catch (error) {
      if (
        error instanceof ImageProcessingAbortedError ||
        error instanceof ImageReadTimeoutError
      ) {
        throw error;
      }
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  try {
    return await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () =>
          reject(
            new ImageCloudFileError(
              "Format d'image non supporté par le navigateur. Essayez JPG ou PNG."
            )
          );
        image.src = blobUrl;
      }),
      decodeTimeoutMs(blob.size),
      () => new ImageReadTimeoutError(),
      signal
    );
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function canvasToJpegDataUrl(
  source: DrawableSource,
  maxWidth: number,
  quality: number
): string {
  const { width: srcW, height: srcH } = sourceDimensions(source);
  const scale = Math.min(1, maxWidth / srcW);
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageCompressionError();
  }

  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Réduit une image jusqu'à tenir dans maxBytes — boucle agressive
 * (qualité + largeur) pour garantir l'envoi IA.
 */
async function compressSource(
  source: DrawableSource,
  target: CompressTarget,
  signal?: AbortSignal
): Promise<string> {
  const minWidth = target.minWidth ?? UPLOAD_MIN_WIDTH;
  let maxWidth = target.maxWidth;
  let quality = 0.82;

  const megapixels =
    (sourceDimensions(source).width * sourceDimensions(source).height) / 1e6;
  if (megapixels > 16) {
    maxWidth = Math.min(maxWidth, 1024);
    quality = 0.72;
  }

  try {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      throwIfAborted(signal);
      await yieldToUi();

      const result = canvasToJpegDataUrl(source, maxWidth, quality);
      if (getImageByteSize(result) <= target.maxBytes) {
        return result;
      }

      if (quality > 0.38) {
        quality -= 0.07;
      } else {
        maxWidth = Math.round(maxWidth * 0.78);
        quality = 0.7;
      }

      if (maxWidth < minWidth) {
        break;
      }
    }

    const last = canvasToJpegDataUrl(source, minWidth, 0.45);
    if (getImageByteSize(last) <= target.maxBytes) {
      return last;
    }

    throw new ImageTooLargeError(
      `Impossible de réduire sous ${formatImageSize(target.maxBytes)} (actuel : ${formatImageSize(getImageByteSize(last))}).`
    );
  } finally {
    releaseSource(source);
  }
}

async function compressBlobToUpload(
  blob: Blob,
  signal?: AbortSignal
): Promise<string> {
  assertSourceSize(blob.size);
  throwIfAborted(signal);

  const source = await decodeBlob(blob, PREVIEW_MAX_WIDTH * 2, signal);
  return compressSource(source, UPLOAD_TARGET, signal);
}

async function compressDataUrlToUpload(
  dataUrl: string,
  signal?: AbortSignal
): Promise<string> {
  throwIfAborted(signal);

  if (getImageByteSize(dataUrl) <= UPLOAD_MAX_BYTES) {
    return dataUrl;
  }

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return compressBlobToUpload(blob, signal);
}

export async function prepareImageFromFile(
  file: File,
  signal?: AbortSignal
): Promise<PreparedImage> {
  throwIfAborted(signal);
  await yieldToUi();

  const blob = await readFileAsBlob(file, signal);
  const dataUrl = await compressBlobToUpload(blob, signal);
  const byteSize = getImageByteSize(dataUrl);

  return {
    dataUrl,
    previewUri: dataUrl,
    byteSize,
    uploadReady: byteSize <= UPLOAD_MAX_BYTES,
  };
}

function pickImageFileViaInput(): Promise<File | null> {
  return new Promise((resolve) => {
    let settled = false;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    const settle = (file: File | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("focus", onWindowFocus);
      input.remove();
      resolve(file);
    };

    input.addEventListener("change", () => {
      settle(input.files?.[0] ?? null);
    });

    if ("oncancel" in input) {
      input.addEventListener("cancel", () => settle(null));
    }

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (!settled && !input.files?.length) {
          settle(null);
        }
      }, FILE_PICKER_FOCUS_GRACE_MS);
    };
    window.addEventListener("focus", onWindowFocus);

    input.click();
  });
}

type OpenFilePickerWindow = Window &
  typeof globalThis & {
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
      startIn?: "desktop" | "documents" | "downloads" | "pictures";
    }) => Promise<Array<{ getFile(): Promise<File> }>>;
  };

export async function pickImageFileWeb(
  preferDesktop = true
): Promise<File | null> {
  const win = window as OpenFilePickerWindow;

  if (preferDesktop && typeof win.showOpenFilePicker === "function") {
    try {
      const handles = await win.showOpenFilePicker({
        types: [
          {
            description: "Photos",
            accept: {
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            },
          },
        ],
        multiple: false,
        startIn: "desktop",
      });
      return (await handles[0]?.getFile()) ?? null;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }
    }
  }

  return pickImageFileViaInput();
}

export async function uriToDataUrl(
  uri: string,
  signal?: AbortSignal
): Promise<string> {
  if (uri.startsWith("data:")) {
    return compressDataUrlToUpload(uri, signal);
  }
  const response = await fetch(uri);
  const blob = await response.blob();
  return compressBlobToUpload(blob, signal);
}

export async function prepareImageFromAsset(
  asset: ImagePickerAsset,
  signal?: AbortSignal
): Promise<PreparedImage> {
  if (asset.fileSize) {
    assertSourceSize(asset.fileSize);
  }

  await yieldToUi();
  throwIfAborted(signal);

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  assertSourceSize(blob.size);

  const dataUrl = await compressBlobToUpload(blob, signal);
  const byteSize = getImageByteSize(dataUrl);

  return {
    dataUrl,
    previewUri: dataUrl,
    byteSize,
    uploadReady: byteSize <= UPLOAD_MAX_BYTES,
  };
}

export async function prepareImageDataUrl(
  input: string,
  signal?: AbortSignal
): Promise<string> {
  return uriToDataUrl(input, signal);
}

/** Garantit une taille compatible IA — recompresse seulement si nécessaire. */
export async function prepareImageForAnalysis(
  dataUrl: string,
  signal?: AbortSignal
): Promise<string> {
  throwIfAborted(signal);

  if (getImageByteSize(dataUrl) <= UPLOAD_MAX_BYTES) {
    return dataUrl;
  }

  return compressDataUrlToUpload(dataUrl, signal);
}

export function extractImageFileFromDataTransfer(
  dataTransfer: DataTransfer
): File | null {
  const items = dataTransfer.items;
  if (items?.length) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item?.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }

  const file = dataTransfer.files?.[0];
  if (file?.type.startsWith("image/")) {
    return file;
  }

  return null;
}
