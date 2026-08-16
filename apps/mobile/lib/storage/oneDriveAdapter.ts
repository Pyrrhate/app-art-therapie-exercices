/**
 * OneDrive — connecteur local-first (Microsoft Graph).
 * Le jeton reste sur l'appareil ; les appels passent par un relais API
 * sans stockage serveur ni secret Vercel (comme kDrive).
 */
import { buildAppBackup, parseAppBackupJson } from "@/lib/backup/build";
import { assertBackupSize, restoreAppBackup } from "@/lib/backup/restore";
import { getApiUrl } from "@/lib/config";
import {
  clearOneDriveCredentials,
  clearOneDriveMeta,
  loadOneDriveCredentials,
  loadOneDriveMeta,
  saveOneDriveCredentials,
  saveOneDriveMeta,
  type OneDriveMeta,
} from "./oneDriveTokens";

async function relay<T>(body: Record<string, unknown>): Promise<T> {
  const base = getApiUrl().replace(/\/$/, "");
  const url = `${base}/api/integrations/onedrive/client`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      base
        ? "Impossible de joindre l'API Pastek (OneDrive). Vérifiez la connexion, puis redéployez l'API si la route est absente."
        : "Impossible de joindre l'API via le proxy local. Relancez Expo (`npx expo start --web --clear`)."
    );
  }

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (response.status === 404) {
    throw new Error(
      "La route OneDrive n'est pas encore disponible sur l'API. Redéployez apps/api, puis réessayez."
    );
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.trim() || `Erreur OneDrive (${response.status}).`
    );
  }
  return payload;
}

export function isOneDriveClientConfigured(): boolean {
  return true;
}

export async function getOneDriveConnectionStatus(): Promise<{
  connected: boolean;
  configured: boolean;
  meta: OneDriveMeta | null;
}> {
  const credentials = await loadOneDriveCredentials();
  const meta = await loadOneDriveMeta();
  return {
    configured: true,
    connected: Boolean(credentials?.accessToken),
    meta,
  };
}

export async function connectOneDrive(input: {
  accessToken: string;
}): Promise<void> {
  const accessToken = input.accessToken.trim();
  if (!accessToken || accessToken.length < 40) {
    throw new Error("Jeton Microsoft Graph trop court ou manquant.");
  }

  const probe = await relay<{ accountHint: string }>({
    action: "probe",
    token: accessToken,
  });

  await saveOneDriveCredentials({ accessToken });
  const prev = await loadOneDriveMeta();
  await saveOneDriveMeta({
    connectedAt: prev?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: prev?.lastSyncAt ?? null,
    accountHint: probe.accountHint,
  });
}

export async function disconnectOneDrive(): Promise<void> {
  await clearOneDriveCredentials();
  await clearOneDriveMeta();
}

export async function backupLocalDataToOneDrive(): Promise<{
  exportedAt: string;
  filCount: number;
}> {
  const credentials = await loadOneDriveCredentials();
  if (!credentials) {
    throw new Error("OneDrive non connecté.");
  }

  const backup = await buildAppBackup();
  const json = JSON.stringify(backup, null, 2);
  assertBackupSize(json);

  await relay({
    action: "uploadBackup",
    token: credentials.accessToken,
    json,
  });

  const meta = await loadOneDriveMeta();
  await saveOneDriveMeta({
    connectedAt: meta?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    accountHint: meta?.accountHint ?? "OneDrive",
  });

  return {
    exportedAt: backup.exportedAt,
    filCount: backup.data.creativeFil.length,
  };
}

export async function restoreLocalDataFromOneDrive(): Promise<{
  filCount: number;
  exportedAt: string;
}> {
  const credentials = await loadOneDriveCredentials();
  if (!credentials) {
    throw new Error("OneDrive non connecté.");
  }

  const { json } = await relay<{ json: string }>({
    action: "downloadBackup",
    token: credentials.accessToken,
  });
  assertBackupSize(json);
  const backup = parseAppBackupJson(json);
  await restoreAppBackup(backup);

  const meta = await loadOneDriveMeta();
  await saveOneDriveMeta({
    connectedAt: meta?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    accountHint: meta?.accountHint ?? "OneDrive",
  });

  return {
    filCount: backup.data.creativeFil.length,
    exportedAt: backup.exportedAt,
  };
}

export async function uploadArtworkPhotoToOneDrive(input: {
  imageBase64: string;
  filEntryId?: string;
}): Promise<{ fileId: string } | null> {
  try {
    const credentials = await loadOneDriveCredentials();
    if (!credentials) return null;

    const dataUrlMatch = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(
      input.imageBase64.trim()
    );
    const mimeType = dataUrlMatch?.[1] ?? "image/jpeg";
    const ext = mimeType.includes("png")
      ? "png"
      : mimeType.includes("webp")
        ? "webp"
        : "jpg";
    const filename = `pastek-${input.filEntryId ?? Date.now()}.${ext}`;

    const result = await relay<{ fileId: string | null }>({
      action: "uploadArtwork",
      token: credentials.accessToken,
      filename,
      mimeType,
      imageBase64: input.imageBase64,
    });
    return result.fileId ? { fileId: result.fileId } : null;
  } catch {
    return null;
  }
}
