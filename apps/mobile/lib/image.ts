/** Fallback TypeScript — Metro charge image.web.ts ou image.native.ts selon la plateforme. */
export * from "./image.shared";
export {
  getImagePickerOptions,
  prepareImageDataUrl,
  prepareImageFromAsset,
  uriToDataUrl,
} from "./image.web";
