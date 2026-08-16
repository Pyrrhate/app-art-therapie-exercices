/**
 * Upload silencieux d'une photo vers les clouds connectés (client-side).
 * Google Drive, Infomaniak kDrive et/ou OneDrive — non bloquant.
 */
import {
  getGoogleDriveConnectionStatus,
  uploadArtworkPhotoToGoogleDrive,
} from "@/lib/storage/googleDriveAdapter";
import {
  getKDriveConnectionStatus,
  uploadArtworkPhotoToKDrive,
} from "@/lib/storage/kDriveAdapter";
import {
  getOneDriveConnectionStatus,
  uploadArtworkPhotoToOneDrive,
} from "@/lib/storage/oneDriveAdapter";

export async function tryUploadArtworkToCloud(
  imageBase64: string | undefined,
  filEntryId?: string
): Promise<void> {
  if (!imageBase64 || imageBase64.length < 100) return;
  try {
    const [gStatus, kStatus, oStatus] = await Promise.all([
      getGoogleDriveConnectionStatus(),
      getKDriveConnectionStatus(),
      getOneDriveConnectionStatus(),
    ]);
    const tasks: Promise<unknown>[] = [];
    if (gStatus.connected) {
      tasks.push(uploadArtworkPhotoToGoogleDrive({ imageBase64, filEntryId }));
    }
    if (kStatus.connected) {
      tasks.push(uploadArtworkPhotoToKDrive({ imageBase64, filEntryId }));
    }
    if (oStatus.connected) {
      tasks.push(uploadArtworkPhotoToOneDrive({ imageBase64, filEntryId }));
    }
    if (tasks.length) await Promise.allSettled(tasks);
  } catch {
    /* non bloquant */
  }
}
