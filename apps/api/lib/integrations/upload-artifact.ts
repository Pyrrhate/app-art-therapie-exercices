import { decryptSecret } from "@/lib/crypto/secrets";
import {
  decryptRefreshToken,
  refreshGoogleDriveAccessToken,
  uploadToGoogleDrive,
} from "./google-drive";
import {
  decryptOneDriveRefreshToken,
  refreshOneDriveAccessToken,
  uploadToOneDrive,
} from "./onedrive";
import {
  getCloudIntegration,
  listConnectedProviders,
  updateCloudAccessToken,
  type OAuthTokens,
} from "./storage";
import type { CloudProviderId } from "./types";

function decodeBase64Image(imageBase64: string): {
  bytes: Buffer;
  mimeType: string;
} {
  const dataUrlMatch = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(
    imageBase64.trim()
  );
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1]!,
      bytes: Buffer.from(dataUrlMatch[2]!, "base64"),
    };
  }
  return {
    mimeType: "image/jpeg",
    bytes: Buffer.from(
      imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    ),
  };
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

type IntegrationRow = NonNullable<
  Awaited<ReturnType<typeof getCloudIntegration>>
>;

function isTokenExpired(row: IntegrationRow): boolean {
  if (!row.token_expires_at) return false;
  const expires = Date.parse(row.token_expires_at);
  if (Number.isNaN(expires)) return false;
  return expires <= Date.now() + 120_000;
}

async function resolveGoogleAccessToken(
  userId: string,
  row: IntegrationRow
): Promise<string | null> {
  const access = row.access_token_encrypted
    ? decryptSecret(row.access_token_encrypted)
    : null;

  if (access && !isTokenExpired(row)) {
    return access;
  }

  const refresh = decryptRefreshToken(row.refresh_token_encrypted);
  if (!refresh) {
    return access;
  }

  const refreshed = await refreshGoogleDriveAccessToken(refresh);
  if (!refreshed) return access;

  await updateCloudAccessToken(userId, "google_drive", refreshed);
  return refreshed.accessToken;
}

async function resolveOneDriveAccessToken(
  userId: string,
  row: IntegrationRow
): Promise<string | null> {
  const access = row.access_token_encrypted
    ? decryptSecret(row.access_token_encrypted)
    : null;

  if (access && !isTokenExpired(row)) {
    return access;
  }

  const refresh = decryptOneDriveRefreshToken(row.refresh_token_encrypted);
  if (!refresh) {
    return access;
  }

  const refreshed = await refreshOneDriveAccessToken(refresh);
  if (!refreshed) return access;

  await updateCloudAccessToken(userId, "onedrive", refreshed);
  return refreshed.accessToken;
}

export async function uploadArtworkToUserCloud(input: {
  userId: string;
  imageBase64: string;
  filEntryId?: string;
  provider?: CloudProviderId;
}): Promise<{
  provider: CloudProviderId;
  remoteId: string;
  remoteUrl?: string;
} | null> {
  const providers = input.provider
    ? [input.provider]
    : await listConnectedProviders(input.userId);

  if (providers.length === 0) return null;

  const { bytes, mimeType } = decodeBase64Image(input.imageBase64);
  const ext = extensionForMime(mimeType);
  const filename = `pastek-${input.filEntryId ?? Date.now()}.${ext}`;

  for (const provider of providers) {
    const row = await getCloudIntegration(input.userId, provider);
    if (!row) continue;

    if (provider === "google_drive") {
      const accessToken = await resolveGoogleAccessToken(input.userId, row);
      if (!accessToken) continue;

      const uploaded = await uploadToGoogleDrive(
        accessToken,
        filename,
        bytes,
        mimeType
      );
      if (uploaded) {
        return {
          provider,
          remoteId: uploaded.fileId,
          remoteUrl: uploaded.webViewLink,
        };
      }
    }

    if (provider === "onedrive") {
      const accessToken = await resolveOneDriveAccessToken(input.userId, row);
      if (!accessToken) continue;

      const uploaded = await uploadToOneDrive(
        accessToken,
        filename,
        bytes,
        mimeType
      );
      if (uploaded) {
        return {
          provider,
          remoteId: uploaded.itemId,
          remoteUrl: uploaded.webUrl,
        };
      }
    }
  }

  return null;
}

export type { OAuthTokens };
