import Constants from "expo-constants";
import { isValidSupabasePublicConfig } from "@art-therapie/shared";
import { getApiUrl } from "@/lib/config";

type ExtraConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

type CredentialPair = {
  url: string;
  anonKey: string;
};

const REMOTE_CONFIG_KEY = "pastek.supabase.public";

let remoteUrl = "";
let remoteAnonKey = "";
let remoteFetch: Promise<boolean> | null = null;

function readExtra(): ExtraConfig {
  return (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
}

function readCachedRemoteConfig(): CredentialPair {
  if (typeof window === "undefined") return { url: "", anonKey: "" };

  try {
    const raw = sessionStorage.getItem(REMOTE_CONFIG_KEY);
    if (!raw) return { url: "", anonKey: "" };

    const data = JSON.parse(raw) as { url?: string; anonKey?: string };
    return {
      url: data.url?.trim() ?? "",
      anonKey: data.anonKey?.trim() ?? "",
    };
  } catch {
    return { url: "", anonKey: "" };
  }
}

function writeCachedRemoteConfig(url: string, anonKey: string): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      REMOTE_CONFIG_KEY,
      JSON.stringify({ url, anonKey })
    );
  } catch {
    // quota / mode privé
  }
}

function pickValidCredentials(
  ...candidates: Array<CredentialPair | undefined>
): CredentialPair {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const url = candidate.url.trim();
    const anonKey = candidate.anonKey.trim();
    if (isValidSupabasePublicConfig(url, anonKey)) {
      return { url, anonKey };
    }
  }
  return { url: "", anonKey: "" };
}

export function getSupabaseCredentials(): CredentialPair {
  const extra = readExtra();
  const cached = readCachedRemoteConfig();

  return pickValidCredentials(
    {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
    },
    {
      url: extra.supabaseUrl?.trim() ?? "",
      anonKey: extra.supabaseAnonKey?.trim() ?? "",
    },
    { url: remoteUrl, anonKey: remoteAnonKey },
    cached
  );
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
          reason?: string;
        };

        if (
          data.configured &&
          data.supabaseUrl?.trim() &&
          data.supabaseAnonKey?.trim() &&
          isValidSupabasePublicConfig(
            data.supabaseUrl.trim(),
            data.supabaseAnonKey.trim()
          )
        ) {
          remoteUrl = data.supabaseUrl.trim();
          remoteAnonKey = data.supabaseAnonKey.trim();
          writeCachedRemoteConfig(remoteUrl, remoteAnonKey);
          return true;
        }

        if (data.reason === "invalid_anon_key") {
          console.warn("[supabase] anon key invalide côté API");
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

  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(REMOTE_CONFIG_KEY);
    } catch {
      // ignore
    }
  }
}
