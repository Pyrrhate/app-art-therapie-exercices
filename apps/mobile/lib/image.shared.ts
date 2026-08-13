import type { ImagePickerOptions } from "expo-image-picker";
import i18n from "@/lib/i18n";

/** Limite corps JSON côté API (~4,5 Mo Vercel). */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Fichier source max avant compression. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/** Cible garantie pour l'envoi IA (vision Hugging Face). */
export const UPLOAD_MAX_BYTES = 380 * 1024;
export const UPLOAD_MAX_WIDTH = 768;
export const UPLOAD_MIN_WIDTH = 320;

/** Alias conservés pour compatibilité interne. */
export const ANALYSIS_MAX_BYTES = UPLOAD_MAX_BYTES;
export const ANALYSIS_MAX_WIDTH = UPLOAD_MAX_WIDTH;

/** Aperçu écran — peut être un peu plus grand que l'envoi IA. */
export const PREVIEW_MAX_BYTES = UPLOAD_MAX_BYTES;
export const PREVIEW_MAX_WIDTH = UPLOAD_MAX_WIDTH;

/** Labels dynamiques (suivent la langue UI). */
export function maxImageLabel(): string {
  return formatImageSize(MAX_IMAGE_BYTES);
}
export function maxSourceLabel(): string {
  return formatImageSize(MAX_SOURCE_BYTES);
}
export function uploadMaxLabel(): string {
  return formatImageSize(UPLOAD_MAX_BYTES);
}

/** @deprecated Prefer maxImageLabel() / maxSourceLabel() / uploadMaxLabel(). */
export const MAX_IMAGE_LABEL = "3 Mo";
export const MAX_SOURCE_LABEL = "15 Mo";
export const UPLOAD_MAX_LABEL = "380 Ko";

export class ImageTooLargeError extends Error {
  constructor(message?: string) {
    super(
      message ??
        i18n.t("common:imageErrors.tooLarge", {
          max: formatImageSize(UPLOAD_MAX_BYTES),
        })
    );
    this.name = "ImageTooLargeError";
  }
}

export class ImageSourceTooLargeError extends Error {
  constructor(sizeBytes: number) {
    super(
      i18n.t("common:imageErrors.sourceTooLarge", {
        size: formatImageSize(sizeBytes),
        max: formatImageSize(MAX_SOURCE_BYTES),
      })
    );
    this.name = "ImageSourceTooLargeError";
  }
}

export class ImageCompressionError extends Error {
  constructor(message?: string) {
    super(message ?? i18n.t("common:imageErrors.compressionFailed"));
    this.name = "ImageCompressionError";
  }
}

export function getImageByteSize(dataUrl: string): number {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024) return i18n.t("common:sizes.bytes", { n: bytes });
  if (bytes < 1024 * 1024) {
    return i18n.t("common:sizes.kb", { n: Math.round(bytes / 1024) });
  }
  return i18n.t("common:sizes.mb", {
    n: (bytes / (1024 * 1024)).toFixed(1),
  });
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
    super(i18n.t("common:imageErrors.aborted"));
    this.name = "ImageProcessingAbortedError";
  }
}

export class ImageCloudFileError extends Error {
  constructor(message?: string) {
    super(message ?? i18n.t("common:imageErrors.cloudFile"));
    this.name = "ImageCloudFileError";
  }
}

export class ImageReadTimeoutError extends Error {
  constructor(message?: string) {
    super(message ?? i18n.t("common:imageErrors.readTimeout"));
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
