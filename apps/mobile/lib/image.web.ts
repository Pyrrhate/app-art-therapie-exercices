import type { ImagePickerAsset } from "expo-image-picker";
import type { ImagePickerOptions } from "expo-image-picker";
import {
  assertSourceSize,
  ANALYSIS_MAX_BYTES,
  ANALYSIS_MAX_WIDTH,
  formatImageSize,
  getImageByteSize,
  getImagePickerOptionsWeb,
  ImageTooLargeError,
  MAX_IMAGE_BYTES,
  type PreparedImage,
  throwIfAborted,
  yieldToUi,
} from "./image.shared";

export * from "./image.shared";

export function getImagePickerOptions(): ImagePickerOptions {
  return getImagePickerOptionsWeb();
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Lecture de l'image impossible."));
    image.src = url;
  });
}

function canvasToJpegDataUrl(
  image: HTMLImageElement,
  maxWidth: number,
  quality: number
): string {
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Compression impossible.");
  }
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function compressBlobOnWeb(
  blob: Blob,
  maxBytes: number = MAX_IMAGE_BYTES,
  signal?: AbortSignal
): Promise<string> {
  assertSourceSize(blob.size);
  throwIfAborted(signal);

  const blobUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImageFromUrl(blobUrl);
    throwIfAborted(signal);

    let quality = blob.size > 5 * 1024 * 1024 ? 0.6 : 0.75;
    let maxWidth = blob.size > 5 * 1024 * 1024 ? 800 : 1024;
    let result = canvasToJpegDataUrl(image, maxWidth, quality);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      throwIfAborted(signal);
      await yieldToUi();

      if (getImageByteSize(result) <= maxBytes) {
        return result;
      }

      quality -= 0.12;
      if (quality < 0.4) {
        maxWidth = Math.round(maxWidth * 0.7);
        quality = 0.65;
      }
      result = canvasToJpegDataUrl(image, maxWidth, quality);
    }

    if (getImageByteSize(result) > maxBytes) {
      throw new ImageTooLargeError();
    }

    return result;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function prepareImageFromFile(
  file: File,
  signal?: AbortSignal
): Promise<PreparedImage> {
  assertSourceSize(file.size);
  throwIfAborted(signal);
  await yieldToUi();

  const dataUrl = await compressBlobOnWeb(file, MAX_IMAGE_BYTES, signal);
  return {
    dataUrl,
    previewUri: dataUrl,
    byteSize: getImageByteSize(dataUrl),
  };
}

/** Sélecteur natif du navigateur — plus fiable que expo-image-picker sur Windows. */
export function pickImageFileWeb(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic,image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0] ?? null;
      cleanup();
      resolve(file);
    });

    input.addEventListener("cancel", () => {
      cleanup();
      resolve(null);
    });

    input.click();
  });
}

export async function uriToDataUrl(uri: string, signal?: AbortSignal): Promise<string> {
  if (uri.startsWith("data:")) {
    throwIfAborted(signal);
    const image = await loadImageFromUrl(uri);
    await yieldToUi();
    return canvasToJpegDataUrl(image, 1024, 0.75);
  }
  const response = await fetch(uri);
  const blob = await response.blob();
  return compressBlobOnWeb(blob, MAX_IMAGE_BYTES, signal);
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

  const dataUrl = await compressBlobOnWeb(blob, MAX_IMAGE_BYTES, signal);
  return {
    dataUrl,
    previewUri: dataUrl,
    byteSize: getImageByteSize(dataUrl),
  };
}

export async function prepareImageDataUrl(
  input: string,
  signal?: AbortSignal
): Promise<string> {
  return uriToDataUrl(input, signal);
}

async function compressDataUrlForAnalysis(
  dataUrl: string,
  signal?: AbortSignal
): Promise<string> {
  throwIfAborted(signal);
  const image = await loadImageFromUrl(dataUrl);
  throwIfAborted(signal);

  let quality = 0.72;
  let maxWidth = ANALYSIS_MAX_WIDTH;
  let result = canvasToJpegDataUrl(image, maxWidth, quality);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    throwIfAborted(signal);
    await yieldToUi();

    if (getImageByteSize(result) <= ANALYSIS_MAX_BYTES) {
      return result;
    }

    quality -= 0.1;
    if (quality < 0.45) {
      maxWidth = Math.round(maxWidth * 0.85);
      quality = 0.65;
    }
    result = canvasToJpegDataUrl(image, maxWidth, quality);
  }

  if (getImageByteSize(result) > ANALYSIS_MAX_BYTES) {
    throw new ImageTooLargeError(
      `Photo trop lourde pour l'analyse (maximum ${formatImageSize(ANALYSIS_MAX_BYTES)}).`
    );
  }

  return result;
}

/** Réduit la photo avant envoi à l'API vision (upload + inférence plus rapides). */
export async function prepareImageForAnalysis(
  dataUrl: string,
  signal?: AbortSignal
): Promise<string> {
  return compressDataUrlForAnalysis(dataUrl, signal);
}
