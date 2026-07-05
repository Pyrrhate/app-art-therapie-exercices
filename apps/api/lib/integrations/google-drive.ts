import { integrationCallbackUrl } from "./storage";
import type { OAuthTokens } from "./storage";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
].join(" ");

export interface GoogleDriveExchangeResult {
  accountId: string;
  tokens: OAuthTokens;
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim()
  );
}

export function buildGoogleDriveAuthUrl(userId: string): string | null {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: integrationCallbackUrl("google_drive"),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: userId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleDriveCode(
  code: string
): Promise<GoogleDriveExchangeResult | null> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: integrationCallbackUrl("google_drive"),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    console.warn("[gdrive] token exchange", await response.text());
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) return null;

  let accountId = "google-drive-connected";
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );
  if (profileRes.ok) {
    const profile = (await profileRes.json()) as { id?: string; email?: string };
    accountId = profile.email ?? profile.id ?? accountId;
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

export async function uploadToGoogleDrive(
  accessToken: string,
  filename: string,
  bytes: Buffer,
  mimeType: string
): Promise<{ fileId: string; webViewLink?: string } | null> {
  const metadata = {
    name: filename,
    parents: undefined as string[] | undefined,
  };

  const boundary = `pastek_${Date.now()}`;
  const bodyParts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ];

  const preamble = Buffer.from(bodyParts.join(""), "utf8");
  const closing = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const body = Buffer.concat([preamble, bytes, closing]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    console.warn("[gdrive] upload", await response.text());
    return null;
  }

  const file = (await response.json()) as { id?: string; webViewLink?: string };
  if (!file.id) return null;
  return { fileId: file.id, webViewLink: file.webViewLink };
}
