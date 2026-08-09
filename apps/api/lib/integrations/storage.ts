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

  // Ne pas écraser un refresh token existant si Google n'en renvoie pas un nouveau
  let refreshToStore = refreshEnc;
  if (tokens && !tokens.refreshToken) {
    const existing = await getCloudIntegration(userId, provider);
    refreshToStore = existing?.refresh_token_encrypted ?? null;
  }

  const { error } = await admin.from("user_cloud_integrations").upsert(
    {
      user_id: userId,
      provider,
      provider_account_id: accountId,
      access_token_encrypted: accessEnc,
      refresh_token_encrypted: refreshToStore,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.warn("[integrations] save", error.message);
    return false;
  }
  return true;
}

/** Met à jour uniquement access (+ refresh si fourni) après refresh OAuth. */
export async function updateCloudAccessToken(
  userId: string,
  provider: CloudProviderId,
  tokens: OAuthTokens
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const accessEnc = encryptSecret(tokens.accessToken);
  if (!accessEnc) return false;

  const patch: Record<string, unknown> = {
    access_token_encrypted: accessEnc,
    token_expires_at:
      tokens.expiresIn && tokens.expiresIn > 0
        ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };

  if (tokens.refreshToken) {
    const refreshEnc = encryptSecret(tokens.refreshToken);
    if (refreshEnc) patch.refresh_token_encrypted = refreshEnc;
  }

  const { error } = await admin
    .from("user_cloud_integrations")
    .update(patch)
    .eq("user_id", userId)
    .eq("provider", provider);

  if (error) {
    console.warn("[integrations] update tokens", error.message);
    return false;
  }
  return true;
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
