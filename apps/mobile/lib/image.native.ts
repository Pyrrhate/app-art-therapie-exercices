import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import type { ImagePickerOptions } from "expo-image-picker";
import {
  assertSourceSize,
  ANALYSIS_MAX_BYTES,
  ANALYSIS_MAX_WIDTH,
  getImageByteSize,
  getImagePickerOptionsNative,
  ImageTooLargeError,
  MAX_IMAGE_BYTES,
  type PreparedImage,
} from "./image.shared";

export * from "./image.shared";

export function getImagePickerOptions(): ImagePickerOptions {
  return getImagePickerOptionsNative();
}

async function compressOnNative(
  uri: string,
  maxBytes: number = MAX_IMAGE_BYTES,
  targetWidth: number = 1280
): Promise<{ dataUrl: string; previewUri: string }> {
  let currentUri = uri;
  let quality = 0.82;
  let maxWidth = targetWidth;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const manipulated = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulated.base64) {
      break;
    }

    const dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;
    if (getImageByteSize(dataUrl) <= maxBytes) {
      return { dataUrl, previewUri: manipulated.uri };
    }

    currentUri = manipulated.uri;
    quality -= 0.1;
    if (quality < 0.45) {
      maxWidth = Math.round(maxWidth * 0.75);
      quality = 0.72;
    }
  }

  throw new ImageTooLargeError();
}

export async function uriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith("data:")) {
    if (getImageByteSize(uri) <= MAX_IMAGE_BYTES) {
      return uri;
    }
    throw new ImageTooLargeError();
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const mimeType = uri.toLowerCase().includes(".png") ? "png" : "jpeg";
  const dataUrl = `data:image/${mimeType};base64,${base64}`;
  return (await compressOnNative(dataUrl)).dataUrl;
}

export async function prepareImageFromAsset(
  asset: ImagePickerAsset,
  signal?: AbortSignal
): Promise<PreparedImage> {
  if (asset.fileSize) {
    assertSourceSize(asset.fileSize);
  }

  const { dataUrl, previewUri } = await compressOnNative(asset.uri);
  return {
    dataUrl,
    previewUri,
    byteSize: getImageByteSize(dataUrl),
  };
}

export async function prepareImageDataUrl(
  input: string,
  _signal?: AbortSignal
): Promise<string> {
  if (input.startsWith("data:")) {
    if (getImageByteSize(input) <= MAX_IMAGE_BYTES) {
      return input;
    }
    throw new ImageTooLargeError();
  }
  return (await compressOnNative(input)).dataUrl;
}

/** Non disponible sur mobile natif — géré par expo-image-picker. */
export function pickImageFileWeb(): Promise<File | null> {
  return Promise.resolve(null);
}

export async function prepareImageFromFile(
  _file: File,
  _signal?: AbortSignal
): Promise<PreparedImage> {
  throw new Error("prepareImageFromFile est réservé au web.");
}

export async function prepareImageForAnalysis(
  dataUrl: string,
  _signal?: AbortSignal
): Promise<string> {
  const { dataUrl: compressed } = await compressOnNative(
    dataUrl,
    ANALYSIS_MAX_BYTES,
    ANALYSIS_MAX_WIDTH
  );
  return compressed;
}
