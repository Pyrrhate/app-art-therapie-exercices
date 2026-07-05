import { encryptSecret } from "@/lib/crypto/secrets";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CloudProviderId } from "./types";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export async function getCloudIntegration(
  userId: string,
  provider: CloudProviderId
) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("user_cloud_integrations")
    .select(
      "provider, connected_at, provider_account_id, access_token_encrypted, refresh_token_encrypted, token_expires_at"
    )
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    console.warn("[integrations] get", error.message);
    return null;
  }

  return data;
}

export async function listConnectedProviders(
  userId: string
): Promise<CloudProviderId[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data } = await admin
    .from("user_cloud_integrations")
    .select("provider")
    .eq("user_id", userId);

  return (data ?? []).map((row) => row.provider as CloudProviderId);
}

export async function disconnectCloudIntegration(
  userId: string,
  provider: CloudProviderId
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const { error } = await admin
    .from("user_cloud_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);

  return !error;
}

export async function saveCloudIntegration(
  userId: string,
  provider: CloudProviderId,
  accountId: string,
  tokens?: OAuthTokens
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const accessEnc = tokens?.accessToken
    ? encryptSecret(tokens.accessToken)
    : null;
  const refreshEnc = tokens?.refreshToken
    ? encryptSecret(tokens.refreshToken)
    : null;

  const expiresAt =
    tokens?.expiresIn && tokens.expiresIn > 0
      ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
      : null;

  const { error } = await admin.from("user_cloud_integrations").upsert(
    {
      user_id: userId,
      provider,
      provider_account_id: accountId,
      access_token_encrypted: accessEnc,
      refresh_token_encrypted: refreshEnc,
      token_expires_at: expiresAt,
    },
    { onConflict: "user_id,provider" }
  );

  return !error;
}

function getApiPublicOrigin(): string {
  const explicit = process.env.API_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function integrationCallbackUrl(provider: CloudProviderId): string {
  const path =
    provider === "google_drive"
      ? "/api/integrations/gdrive"
      : "/api/integrations/onedrive";
  return `${getApiPublicOrigin()}${path}`;
}
