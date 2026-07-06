import Constants from "expo-constants";
import { getApiUrl } from "@/lib/config";

type ExtraConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

let remoteUrl = "";
let remoteAnonKey = "";
let remoteFetch: Promise<boolean> | null = null;

function readExtra(): ExtraConfig {
  return (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
}

export function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
} {
  const extra = readExtra();
  return {
    url:
      process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
      extra.supabaseUrl?.trim() ||
      remoteUrl,
    anonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      extra.supabaseAnonKey?.trim() ||
      remoteAnonKey,
  };
}

/** Charge l'URL Supabase depuis l'API si les variables Expo ne sont pas en build. */
export async function ensureSupabaseConfigured(): Promise<boolean> {
  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey) return true;

  if (!remoteFetch) {
    remoteFetch = (async () => {
      try {
        const base = getApiUrl().replace(/\/$/, "");
        if (!base) return false;

        const response = await fetch(`${base}/api/config/public`);
        if (!response.ok) return false;

        const data = (await response.json()) as {
          configured?: boolean;
          supabaseUrl?: string;
          supabaseAnonKey?: string;
        };

        if (
          data.configured &&
          data.supabaseUrl?.trim() &&
          data.supabaseAnonKey?.trim()
        ) {
          remoteUrl = data.supabaseUrl.trim();
          remoteAnonKey = data.supabaseAnonKey.trim();
          return true;
        }
      } catch (error) {
        console.warn("[supabase] remote config", error);
      }
      return false;
    })();
  }

  return remoteFetch;
}

export function resetSupabaseRemoteConfig(): void {
  remoteUrl = "";
  remoteAnonKey = "";
  remoteFetch = null;
}
