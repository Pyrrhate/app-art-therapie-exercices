import type { ImagePickerOptions } from "expo-image-picker";

/** Limite envoyée à l'API (Vercel ~4,5 Mo de corps JSON). */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_LABEL = "3 Mo";

/** Image pour envoi IA — plus petite = analyse plus rapide. */
export const ANALYSIS_MAX_BYTES = 450 * 1024;
export const ANALYSIS_MAX_WIDTH = 768;
export const MAX_SOURCE_LABEL = "15 Mo";

export class ImageTooLargeError extends Error {
  constructor(
    message = `Photo trop lourde (maximum ${MAX_IMAGE_LABEL}). Choisissez une image plus petite ou reprenez la photo.`
  ) {
    super(message);
    this.name = "ImageTooLargeError";
  }
}

export class ImageSourceTooLargeError extends Error {
  constructor(sizeBytes: number) {
    super(
      `Fichier trop lourd (${formatImageSize(sizeBytes)}). Maximum à la sélection : ${MAX_SOURCE_LABEL}. Choisissez une photo plus légère ou une capture d'écran.`
    );
    this.name = "ImageSourceTooLargeError";
  }
}

export function getImageByteSize(dataUrl: string): number {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function assertSourceSize(bytes: number) {
  if (bytes > MAX_SOURCE_BYTES) {
    throw new ImageSourceTooLargeError(bytes);
  }
}

export function getImagePickerOptionsWeb(): ImagePickerOptions {
  return { mediaTypes: ["images"], base64: false, quality: 1 };
}

export function getImagePickerOptionsNative(): ImagePickerOptions {
  return { mediaTypes: ["images"], base64: true, quality: 0.8 };
}

export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export class ImageProcessingAbortedError extends Error {
  constructor() {
    super("Traitement de la photo annulé.");
    this.name = "ImageProcessingAbortedError";
  }
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ImageProcessingAbortedError();
  }
}

export type PreparedImage = {
  dataUrl: string;
  previewUri: string;
  byteSize: number;
};
