import { decryptSecret } from "@/lib/crypto/secrets";
import { signOAuthState } from "./oauth-state";
import { integrationCallbackUrl } from "./storage";
import type { OAuthTokens } from "./storage";

const ONEDRIVE_SCOPES = [
  "Files.ReadWrite",
  "offline_access",
  "User.Read",
].join(" ");

const PASTEK_FOLDER = "Pastek Art";

export interface OneDriveExchangeResult {
  accountId: string;
  tokens: OAuthTokens;
}

export function isOneDriveConfigured(): boolean {
  return Boolean(
    process.env.ONEDRIVE_CLIENT_ID?.trim() &&
      process.env.ONEDRIVE_CLIENT_SECRET?.trim()
  );
}

export function buildOneDriveAuthUrl(userId: string): string | null {
  const clientId = process.env.ONEDRIVE_CLIENT_ID?.trim();
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: integrationCallbackUrl("onedrive"),
    response_type: "code",
    scope: ONEDRIVE_SCOPES,
    state: signOAuthState(userId, "onedrive"),
    // Force consent pour obtenir un refresh_token fiable
    prompt: "consent",
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeOneDriveCode(
  code: string
): Promise<OneDriveExchangeResult | null> {
  const clientId = process.env.ONEDRIVE_CLIENT_ID?.trim();
  const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: integrationCallbackUrl("onedrive"),
        grant_type: "authorization_code",
      }),
    }
  );

  if (!response.ok) {
    console.warn("[onedrive] token exchange", await response.text());
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) return null;

  let accountId = "onedrive-connected";
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (profileRes.ok) {
    const profile = (await profileRes.json()) as {
      id?: string;
      mail?: string;
      userPrincipalName?: string;
    };
    accountId =
      profile.mail ?? profile.userPrincipalName ?? profile.id ?? accountId;
  }

  return {
    accountId,
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    },
  };
}

export async function refreshOneDriveAccessToken(
  refreshToken: string
): Promise<OAuthTokens | null> {
  const clientId = process.env.ONEDRIVE_CLIENT_ID?.trim();
  const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: ONEDRIVE_SCOPES,
      }),
    }
  );

  if (!response.ok) {
    console.warn("[onedrive] refresh", await response.text());
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) return null;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in,
  };
}

export async function uploadToOneDrive(
  accessToken: string,
  filename: string,
  bytes: Buffer,
  mimeType: string
): Promise<{ itemId: string; webUrl?: string } | null> {
  // Crée / utilise le dossier « Pastek Art » automatiquement
  const path = `${PASTEK_FOLDER}/${filename}`
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${path}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(bytes),
    }
  );

  if (!response.ok) {
    console.warn("[onedrive] upload", await response.text());
    return null;
  }

  const item = (await response.json()) as { id?: string; webUrl?: string };
  if (!item.id) return null;
  return { itemId: item.id, webUrl: item.webUrl };
}

export function decryptOneDriveRefreshToken(
  encrypted: string | null | undefined
): string | null {
  if (!encrypted) return null;
  return decryptSecret(encrypted);
}
