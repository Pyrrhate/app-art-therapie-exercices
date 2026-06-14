import type { ImagePickerOptions } from "expo-image-picker";

/** Limite corps JSON côté API (~4,5 Mo Vercel). */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_LABEL = "3 Mo";

/** Fichier source max avant compression. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
export const MAX_SOURCE_LABEL = "15 Mo";

/** Cible garantie pour l'envoi IA (vision Hugging Face). */
export const UPLOAD_MAX_BYTES = 380 * 1024;
export const UPLOAD_MAX_WIDTH = 768;
export const UPLOAD_MIN_WIDTH = 320;
export const UPLOAD_MAX_LABEL = "380 Ko";

/** Alias conservés pour compatibilité interne. */
export const ANALYSIS_MAX_BYTES = UPLOAD_MAX_BYTES;
export const ANALYSIS_MAX_WIDTH = UPLOAD_MAX_WIDTH;

/** Aperçu écran — peut être un peu plus grand que l'envoi IA. */
export const PREVIEW_MAX_BYTES = UPLOAD_MAX_BYTES;
export const PREVIEW_MAX_WIDTH = UPLOAD_MAX_WIDTH;

export class ImageTooLargeError extends Error {
  constructor(
    message = `Impossible de réduire la photo sous ${UPLOAD_MAX_LABEL}. Essayez une capture plus légère.`
  ) {
    super(message);
    this.name = "ImageTooLargeError";
  }
}

export class ImageSourceTooLargeError extends Error {
  constructor(sizeBytes: number) {
    super(
      `Fichier trop lourd (${formatImageSize(sizeBytes)}). Maximum : ${MAX_SOURCE_LABEL}.`
    );
    this.name = "ImageSourceTooLargeError";
  }
}

export class ImageCompressionError extends Error {
  constructor(message = "Compression de la photo impossible.") {
    super(message);
    this.name = "ImageCompressionError";
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

/** Délai total de préparation selon la taille du fichier source. */
export function processTimeoutMs(sourceBytes: number): number {
  const mb = sourceBytes / (1024 * 1024);
  if (mb > 10) return 120_000;
  if (mb > 5) return 90_000;
  if (mb > 2) return 60_000;
  return 45_000;
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

export class ImageCloudFileError extends Error {
  constructor(
    message = "Cette photo n'est pas disponible localement (OneDrive nuage). Copiez-la sur le Bureau ou glissez-la dans la zone prévue."
  ) {
    super(message);
    this.name = "ImageCloudFileError";
  }
}

export class ImageReadTimeoutError extends Error {
  constructor(
    message = "Lecture de la photo trop lente. Copiez-la sur le Bureau ou glissez-la dans la zone prévue."
  ) {
    super(message);
    this.name = "ImageReadTimeoutError";
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
  /** Taille prête pour l'IA sans recompression. */
  uploadReady: boolean;
};

export type CompressTarget = {
  maxBytes: number;
  maxWidth: number;
  minWidth?: number;
};
