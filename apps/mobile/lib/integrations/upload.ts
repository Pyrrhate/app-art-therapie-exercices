import {
  getGoogleDriveConnectionStatus,
  uploadArtworkPhotoToGoogleDrive,
} from "@/lib/storage/googleDriveAdapter";
import {
  getKDriveConnectionStatus,
  uploadArtworkPhotoToKDrive,
} from "@/lib/storage/kDriveAdapter";

/**
 * Upload silencieux d'une photo vers les clouds connectés (client-side).
 * Google Drive et/ou Infomaniak kDrive — non bloquant.
 */
export async function tryUploadArtworkToCloud(
  imageBase64: string | undefined,
  filEntryId?: string
): Promise<void> {
  if (!imageBase64 || imageBase64.length < 100) return;
  try {
    const [gStatus, kStatus] = await Promise.all([
      getGoogleDriveConnectionStatus(),
      getKDriveConnectionStatus(),
    ]);
    const tasks: Promise<unknown>[] = [];
    if (gStatus.connected) {
      tasks.push(uploadArtworkPhotoToGoogleDrive({ imageBase64, filEntryId }));
    }
    if (kStatus.connected) {
      tasks.push(uploadArtworkPhotoToKDrive({ imageBase64, filEntryId }));
    }
    if (tasks.length) await Promise.allSettled(tasks);
  } catch {
    /* non bloquant */
  }
}
