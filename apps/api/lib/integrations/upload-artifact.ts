import { decryptSecret } from "@/lib/crypto/secrets";
import { uploadToGoogleDrive } from "./google-drive";
import { uploadToOneDrive } from "./onedrive";
import {
  getCloudIntegration,
  listConnectedProviders,
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

function readAccessToken(row: {
  access_token_encrypted: string | null;
}): string | null {
  if (!row.access_token_encrypted) return null;
  return decryptSecret(row.access_token_encrypted);
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

    const accessToken = readAccessToken(row);
    if (!accessToken) continue;

    if (provider === "google_drive") {
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
