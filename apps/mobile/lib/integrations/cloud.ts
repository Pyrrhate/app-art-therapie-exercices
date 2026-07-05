import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase/client";

export type CloudProviderId = "google_drive" | "onedrive";

export interface CloudIntegrationStatus {
  provider: CloudProviderId;
  connected: boolean;
  connectedAt: string | null;
  providerAccountId: string | null;
  configured: boolean;
}

interface CloudConnectResponse {
  status: "oauth" | "stub" | "disconnected";
  authUrl?: string;
  message?: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function integrationPath(provider: CloudProviderId): string {
  return provider === "google_drive"
    ? "/api/integrations/gdrive"
    : "/api/integrations/onedrive";
}

export async function fetchCloudIntegrationStatus(
  provider: CloudProviderId
): Promise<CloudIntegrationStatus | null> {
  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}${integrationPath(provider)}`, {
    headers: await authHeaders(),
  });

  if (!response.ok) return null;
  return (await response.json()) as CloudIntegrationStatus;
}

export async function connectCloudProvider(
  provider: CloudProviderId
): Promise<void> {
  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}${integrationPath(provider)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ action: "connect" }),
  });

  const data = (await response.json()) as CloudConnectResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Connexion impossible.");
  }

  if (data.status === "stub") {
    throw new Error(data.message ?? "OAuth non configuré côté serveur.");
  }

  if (data.status === "oauth" && data.authUrl) {
    if (Platform.OS === "web") {
      window.location.href = data.authUrl;
      return;
    }
    await WebBrowser.openAuthSessionAsync(data.authUrl);
  }
}

export async function disconnectCloudProvider(
  provider: CloudProviderId
): Promise<void> {
  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}${integrationPath(provider)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ action: "disconnect" }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Déconnexion impossible.");
  }
}
