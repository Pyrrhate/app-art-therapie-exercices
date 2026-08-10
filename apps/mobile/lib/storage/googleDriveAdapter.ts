/**
 * Google Drive — connecteur local-first (OAuth + REST côté appareil).
 * Aucun token n'est envoyé au backend Pastek.
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { buildAppBackup, parseAppBackupJson } from "@/lib/backup/build";
import { assertBackupSize, restoreAppBackup } from "@/lib/backup/restore";
import { getApiUrl } from "@/lib/config";
import {
  clearGoogleDriveMeta,
  clearGoogleDriveTokens,
  loadGoogleDriveMeta,
  loadGoogleDriveTokens,
  saveGoogleDriveMeta,
  saveGoogleDriveTokens,
  type GoogleDriveMeta,
  type GoogleDriveTokenBundle,
} from "./googleDriveTokens";

WebBrowser.maybeCompleteAuthSession();

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FILENAME = "pastek-art-backup.json";
const PASTEK_FOLDER = "Pastek Art";

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

function getClientId(): string {
  const id = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim();
  if (!id) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID manquant. Ajoutez l'ID client Google (type Web) sur le build."
    );
  }
  return id;
}

function getRedirectUri(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/app/premium-cloud`;
  }
  return AuthSession.makeRedirectUri({
    scheme: "pastekart",
    path: "premium-cloud",
  });
}

export function isGoogleDriveClientConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim());
}

export async function getGoogleDriveConnectionStatus(): Promise<{
  connected: boolean;
  configured: boolean;
  meta: GoogleDriveMeta | null;
}> {
  const configured = isGoogleDriveClientConfigured();
  const tokens = await loadGoogleDriveTokens();
  const meta = await loadGoogleDriveMeta();
  return {
    configured,
    connected: Boolean(tokens?.accessToken),
    meta,
  };
}

async function exchangeCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<GoogleDriveTokenBundle> {
  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/integrations/gdrive/client-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "exchange",
      code,
      codeVerifier,
      redirectUri,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    accessToken?: string;
    refreshToken?: string | null;
    expiresIn?: number;
    scope?: string | null;
    error?: string;
  };

  if (!response.ok || !payload.accessToken) {
    const detail = payload.error?.trim();
    throw new Error(
      detail
        ? `Échange OAuth Google refusé. ${detail}`
        : `Échange OAuth Google refusé. Vérifiez le Client ID et l'URI de redirection (doit être exactement ${redirectUri}, sans slash final).`
    );
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? undefined,
    expiresAt: Date.now() + (payload.expiresIn ?? 3600) * 1000,
    scope: payload.scope ?? undefined,
  };
}

async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleDriveTokenBundle | null> {
  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/integrations/gdrive/client-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "refresh",
      refreshToken,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string | null;
  };
  if (!data.accessToken) return null;

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? refreshToken,
    expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000,
    scope: data.scope ?? undefined,
  };
}

async function getValidAccessToken(): Promise<string> {
  let tokens = await loadGoogleDriveTokens();
  if (!tokens) {
    throw new Error("Google Drive non connecté.");
  }

  if (tokens.expiresAt > Date.now() + 60_000) {
    return tokens.accessToken;
  }

  if (tokens.refreshToken) {
    const refreshed = await refreshAccessToken(tokens.refreshToken);
    if (refreshed) {
      await saveGoogleDriveTokens(refreshed);
      return refreshed.accessToken;
    }
  }

  throw new Error(
    "Session Google Drive expirée. Reconnectez Drive dans les réglages."
  );
}

/** Lance le flux OAuth Google (PKCE) — tokens restent sur l'appareil. */
export async function connectGoogleDrive(): Promise<void> {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: [DRIVE_SCOPE, "openid", "email"],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });

  await request.makeAuthUrlAsync(discovery);

  const result = await request.promptAsync(discovery, {
    showInRecents: true,
  });

  if (result.type !== "success" || !result.params.code) {
    if (result.type === "dismiss" || result.type === "cancel") {
      throw new Error("Connexion Google annulée.");
    }
    throw new Error("Connexion Google échouée.");
  }

  if (!request.codeVerifier) {
    throw new Error("PKCE code_verifier manquant.");
  }

  const tokens = await exchangeCode(
    result.params.code,
    request.codeVerifier,
    redirectUri
  );
  await saveGoogleDriveTokens(tokens);

  let accountHint: string | null = null;
  try {
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
    );
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { email?: string };
      accountHint = profile.email ?? null;
    }
  } catch {
    /* optionnel */
  }

  const prev = await loadGoogleDriveMeta();
  await saveGoogleDriveMeta({
    connectedAt: prev?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: prev?.lastSyncAt ?? null,
    accountHint,
  });
}

export async function disconnectGoogleDrive(): Promise<void> {
  const tokens = await loadGoogleDriveTokens();
  if (tokens?.accessToken) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokens.accessToken)}`,
        { method: "POST" }
      );
    } catch {
      /* ignore */
    }
  }
  await clearGoogleDriveTokens();
  await clearGoogleDriveMeta();
}

async function ensurePastekFolder(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${PASTEK_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (listRes.ok) {
    const list = (await listRes.json()) as { files?: Array<{ id?: string }> };
    if (list.files?.[0]?.id) return list.files[0].id;
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: PASTEK_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!createRes.ok) return null;
  const created = (await createRes.json()) as { id?: string };
  return created.id ?? null;
}

async function findBackupFile(
  accessToken: string,
  folderId: string | null
): Promise<string | null> {
  const parts = [
    `name='${BACKUP_FILENAME}'`,
    "trashed=false",
    folderId ? `'${folderId}' in parents` : null,
  ].filter(Boolean);
  const q = encodeURIComponent(parts.join(" and "));
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)&pageSize=1&orderBy=modifiedTime desc`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { files?: Array<{ id?: string }> };
  return data.files?.[0]?.id ?? null;
}

async function uploadJsonFile(
  accessToken: string,
  folderId: string | null,
  filename: string,
  json: string,
  existingFileId?: string | null
): Promise<void> {
  const metadata: { name: string; parents?: string[]; mimeType: string } = {
    name: filename,
    mimeType: "application/json",
  };
  if (!existingFileId && folderId) {
    metadata.parents = [folderId];
  }

  const boundary = `pastek_${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${json}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const response = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    console.warn("[gdrive client] upload json", await response.text());
    throw new Error("Échec de l'envoi de la sauvegarde vers Google Drive.");
  }
}

/** Exporte le Fil + préférences vers Drive (fichier JSON dans « Pastek Art »). */
export async function backupLocalDataToGoogleDrive(): Promise<{
  exportedAt: string;
  filCount: number;
}> {
  const accessToken = await getValidAccessToken();
  const backup = await buildAppBackup();
  const json = JSON.stringify(backup, null, 2);
  assertBackupSize(json);

  const folderId = await ensurePastekFolder(accessToken);
  const existingId = await findBackupFile(accessToken, folderId);
  await uploadJsonFile(
    accessToken,
    folderId,
    BACKUP_FILENAME,
    json,
    existingId
  );

  const meta = await loadGoogleDriveMeta();
  await saveGoogleDriveMeta({
    connectedAt: meta?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    accountHint: meta?.accountHint ?? null,
  });

  return {
    exportedAt: backup.exportedAt,
    filCount: backup.data.creativeFil.length,
  };
}

/** Restaure depuis le JSON Drive vers le stockage local. */
export async function restoreLocalDataFromGoogleDrive(): Promise<{
  filCount: number;
  exportedAt: string;
}> {
  const accessToken = await getValidAccessToken();
  const folderId = await ensurePastekFolder(accessToken);
  const fileId = await findBackupFile(accessToken, folderId);
  if (!fileId) {
    throw new Error(
      "Aucune sauvegarde Pastek Art trouvée sur Drive (fichier pastek-art-backup.json)."
    );
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error("Impossible de lire la sauvegarde sur Google Drive.");
  }

  const json = await res.text();
  assertBackupSize(json);
  const backup = parseAppBackupJson(json);
  await restoreAppBackup(backup);

  const meta = await loadGoogleDriveMeta();
  await saveGoogleDriveMeta({
    connectedAt: meta?.connectedAt ?? new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    accountHint: meta?.accountHint ?? null,
  });

  return {
    filCount: backup.data.creativeFil.length,
    exportedAt: backup.exportedAt,
  };
}

/** Upload d'une photo d'œuvre vers le dossier Pastek Art (optionnel). */
export async function uploadArtworkPhotoToGoogleDrive(input: {
  imageBase64: string;
  filEntryId?: string;
}): Promise<{ fileId: string } | null> {
  try {
    const accessToken = await getValidAccessToken();
    const dataUrlMatch = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(
      input.imageBase64.trim()
    );
    const mimeType = dataUrlMatch?.[1] ?? "image/jpeg";
    const b64 =
      dataUrlMatch?.[2] ??
      input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const ext = mimeType.includes("png")
      ? "png"
      : mimeType.includes("webp")
        ? "webp"
        : "jpg";
    const filename = `pastek-${input.filEntryId ?? Date.now()}.${ext}`;
    const folderId = await ensurePastekFolder(accessToken);

    const metadata: { name: string; parents?: string[] } = { name: filename };
    if (folderId) metadata.parents = [folderId];

    const boundary = `pastek_img_${Date.now()}`;
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const fileHeader = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const closing = `\r\n--${boundary}--`;

    const preamble = new TextEncoder().encode(metaPart + fileHeader);
    const end = new TextEncoder().encode(closing);
    const body = new Uint8Array(preamble.length + bytes.length + end.length);
    body.set(preamble, 0);
    body.set(bytes, preamble.length);
    body.set(end, preamble.length + bytes.length);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) return null;
    const file = (await response.json()) as { id?: string };
    return file.id ? { fileId: file.id } : null;
  } catch {
    return null;
  }
}
