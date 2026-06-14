import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import type { ImagePickerOptions } from "expo-image-picker";
import {
  assertSourceSize,
  getImageByteSize,
  getImagePickerOptionsNative,
  ImageTooLargeError,
  type PreparedImage,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_WIDTH,
  UPLOAD_MIN_WIDTH,
} from "./image.shared";

export * from "./image.shared";

export function getImagePickerOptions(): ImagePickerOptions {
  return getImagePickerOptionsNative();
}

async function compressOnNative(
  uri: string,
  maxBytes: number = UPLOAD_MAX_BYTES,
  targetWidth: number = UPLOAD_MAX_WIDTH
): Promise<{ dataUrl: string; previewUri: string }> {
  let currentUri = uri;
  let quality = 0.82;
  let maxWidth = targetWidth;
  const minWidth = UPLOAD_MIN_WIDTH;

  for (let attempt = 0; attempt < 14; attempt += 1) {
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
    if (quality > 0.4) {
      quality -= 0.08;
    } else {
      maxWidth = Math.round(maxWidth * 0.78);
      quality = 0.68;
    }

    if (maxWidth < minWidth) {
      break;
    }
  }

  throw new ImageTooLargeError();
}

export async function uriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith("data:")) {
    if (getImageByteSize(uri) <= UPLOAD_MAX_BYTES) {
      return uri;
    }
    return (await compressOnNative(uri)).dataUrl;
  }

  const { dataUrl } = await compressOnNative(uri);
  return dataUrl;
}

export async function prepareImageFromAsset(
  asset: ImagePickerAsset,
  _signal?: AbortSignal
): Promise<PreparedImage> {
  if (asset.fileSize) {
    assertSourceSize(asset.fileSize);
  }

  const { dataUrl, previewUri } = await compressOnNative(asset.uri);
  const byteSize = getImageByteSize(dataUrl);

  return {
    dataUrl,
    previewUri,
    byteSize,
    uploadReady: byteSize <= UPLOAD_MAX_BYTES,
  };
}

export async function prepareImageDataUrl(
  input: string,
  _signal?: AbortSignal
): Promise<string> {
  return uriToDataUrl(input);
}

export function pickImageFileWeb(): Promise<File | null> {
  return Promise.resolve(null);
}

export function extractImageFileFromDataTransfer(
  _dataTransfer: DataTransfer
): File | null {
  return null;
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
  if (getImageByteSize(dataUrl) <= UPLOAD_MAX_BYTES) {
    return dataUrl;
  }
  return (await compressOnNative(dataUrl)).dataUrl;
}
