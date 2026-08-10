import {
  getGoogleDriveConnectionStatus,
  uploadArtworkPhotoToGoogleDrive,
} from "@/lib/storage/googleDriveAdapter";

/**
 * Upload silencieux d'une photo vers Google Drive (client-side).
 * Ne passe plus par le compte Pastek / API.
 */
export async function tryUploadArtworkToCloud(
  imageBase64: string | undefined,
  filEntryId?: string
): Promise<void> {
  if (!imageBase64 || imageBase64.length < 100) return;
  try {
    const status = await getGoogleDriveConnectionStatus();
    if (!status.connected) return;
    await uploadArtworkPhotoToGoogleDrive({ imageBase64, filEntryId });
  } catch {
    /* non bloquant */
  }
}
