/**
 * Infomaniak kDrive — connecteur local-first.
 * Le jeton reste sur l'appareil ; les appels passent par un relais API
 * (sans stockage serveur) pour contourner le CORS navigateur.
 */
import { buildAppBackup, parseAppBackupJson } from "@/lib/backup/build";
import { assertBackupSize, restoreAppBackup } from "@/lib/backup/restore";
import { getApiUrl } from "@/lib/config";
import {
  clearKDriveCredentials,
  clearKDriveMeta,
  loadKDriveCredentials,
  loadKDriveMeta,
  saveKDriveCredentials,
  saveKDriveMeta,
  type KDriveMeta,
} from "./kDriveTokens";

async function relay<T>(
  body: Record<string, unknown>
): Promise<T> {
  const base = getApiUrl().replace(/\/$/, "");
  const url = `${base}/api/integrations/kdrive/client`;

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
        ? "Impossible de joindre l'API Pastek (kDrive). Vérifiez la connexion, puis redéployez l'API si la route /api/integrations/kdrive/client est absente."
        : "Impossible de joindre l'API via le proxy local. Relancez Expo (`npx expo start --web --clear`)."
    );
  }

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (response.status === 404) {
    throw new Error(
      "La route kDrive n'est pas encore disponible sur l'API. Redéployez apps/api (commit kDrive), puis réessayez."
    );
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.trim() || `Erreur kDrive (${response.status}).`
    );
  }
  return payload;
}

export function isKDriveClientConfigured(): boolean {
  // Aucune clé Expo requise : l'utilisateur fournit son jeton Infomaniak.
  return true;
}

export async function getKDriveConnectionStatus(): Promise<{
  connected: boolean;
  configured: boolean;
  meta: KDriveMeta | null;
}> {
  const credentials = await loadKDriveCredentials();
  const meta = await loadKDriveMeta();
  return {
    configured: true,
    connected: Boolean(credentials?.apiToken && credentials.driveId),
    meta,
  };
}

export async function connectKDrive(input: {
  apiToken: string;
  driveId: string | number;
}): Promise<void> {
  const apiToken = input.apiToken.trim();
  const driveId = Number(String(input.driveId).trim());
  if (!apiToken || apiToken.length < 20) {
    throw new Error("Jeton API Infomaniak trop court ou manquant.");
  }
  if (!Number.isFinite(driveId) || driveId <= 0) {
    throw new Error(
      "Identifiant kDrive invalide. Utilisez le nombre après /drive/ dans l'URL kDrive."
    );
  }

  await relay({ action: "probe", token: apiToken, driveId });

  await saveKDriveCredentials({ apiToken, driveId });
  const prev = await loadKDriveMeta();
  await saveKDriveMeta({
    connectedAt: prev?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: prev?.lastSyncAt ?? null,
    accountHint: `kDrive #${driveId}`,
  });
}

export async function disconnectKDrive(): Promise<void> {
  await clearKDriveCredentials();
  await clearKDriveMeta();
}

export async function backupLocalDataToKDrive(): Promise<{
  exportedAt: string;
  filCount: number;
}> {
  const credentials = await loadKDriveCredentials();
  if (!credentials) {
    throw new Error("kDrive non connecté.");
  }

  const backup = await buildAppBackup();
  const json = JSON.stringify(backup, null, 2);
  assertBackupSize(json);

  await relay({
    action: "uploadBackup",
    token: credentials.apiToken,
    driveId: credentials.driveId,
    json,
  });

  const meta = await loadKDriveMeta();
  await saveKDriveMeta({
    connectedAt: meta?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    accountHint: meta?.accountHint ?? `kDrive #${credentials.driveId}`,
  });

  return {
    exportedAt: backup.exportedAt,
    filCount: backup.data.creativeFil.length,
  };
}

export async function restoreLocalDataFromKDrive(): Promise<{
  filCount: number;
  exportedAt: string;
}> {
  const credentials = await loadKDriveCredentials();
  if (!credentials) {
    throw new Error("kDrive non connecté.");
  }

  const { json } = await relay<{ json: string }>({
    action: "downloadBackup",
    token: credentials.apiToken,
    driveId: credentials.driveId,
  });
  assertBackupSize(json);
  const backup = parseAppBackupJson(json);
  await restoreAppBackup(backup);

  const meta = await loadKDriveMeta();
  await saveKDriveMeta({
    connectedAt: meta?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    accountHint: meta?.accountHint ?? `kDrive #${credentials.driveId}`,
  });

  return {
    filCount: backup.data.creativeFil.length,
    exportedAt: backup.exportedAt,
  };
}

export async function uploadArtworkPhotoToKDrive(input: {
  imageBase64: string;
  filEntryId?: string;
}): Promise<{ fileId: number } | null> {
  try {
    const credentials = await loadKDriveCredentials();
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

    const result = await relay<{ fileId: number | null }>({
      action: "uploadArtwork",
      token: credentials.apiToken,
      driveId: credentials.driveId,
      filename,
      mimeType,
      imageBase64: input.imageBase64,
    });
    return result.fileId ? { fileId: result.fileId } : null;
  } catch {
    return null;
  }
}
