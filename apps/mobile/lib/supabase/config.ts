import Constants from "expo-constants";
import { isValidSupabasePublicConfig, isValidSupabaseUrl } from "@art-therapie/shared";
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
export async function ensureSupabaseConfigured(
  forceRefresh = false
): Promise<boolean> {
  if (forceRefresh) {
    remoteFetch = null;
    remoteUrl = "";
    remoteAnonKey = "";
  }

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

export type SupabaseConfigIssue =
  | "ok"
  | "missing_api"
  | "api_unreachable"
  | "not_configured"
  | "invalid_anon_key"
  | "invalid_url"
  | "invalid_expo_env";

/** Diagnostic lisible pour l'UI (Réglages / connexion). */
export async function diagnoseSupabaseConfigIssue(): Promise<SupabaseConfigIssue> {
  const apiBase = getApiUrl().replace(/\/$/, "");
  if (!apiBase) return "missing_api";

  const expoUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const expoKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (expoUrl || expoKey) {
    if (!isValidSupabasePublicConfig(expoUrl, expoKey)) {
      return "invalid_expo_env";
    }
  }

  try {
    const response = await fetch(`${apiBase}/api/config/public`);
    if (!response.ok) return "api_unreachable";

    const data = (await response.json()) as {
      configured?: boolean;
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      reason?: string;
    };

    if (data.configured) return "ok";
    if (data.reason === "invalid_anon_key") return "invalid_anon_key";

    const url = data.supabaseUrl?.trim() ?? "";
    const key = data.supabaseAnonKey?.trim() ?? "";
    if (url && !isValidSupabaseUrl(url)) return "invalid_url";
    if (url && key && !isValidSupabasePublicConfig(url, key)) {
      return "invalid_anon_key";
    }

    return "not_configured";
  } catch {
    return "api_unreachable";
  }
}

export function supabaseConfigIssueMessage(issue: SupabaseConfigIssue): string {
  switch (issue) {
    case "invalid_anon_key":
      return "La clé Supabase anon sur Vercel est invalide ou incomplète. Recopiez la clé anon complète depuis Supabase → Project Settings → API (elle commence par eyJhbGci...), puis redéployez l'API.";
    case "invalid_expo_env":
      return "Les variables EXPO_PUBLIC_SUPABASE_* du site web sont incorrectes. Utilisez l'URL *.supabase.co et la clé anon complète, ou laissez-les vides pour charger via l'API.";
    case "invalid_url":
      return "SUPABASE_URL sur Vercel doit être l'URL du projet Supabase (https://xxxx.supabase.co), pas l'URL de l'API Pastek.";
    case "api_unreachable":
      return "Impossible de joindre l'API. Vérifiez EXPO_PUBLIC_API_URL (https://api.pastek-art.eu) et le déploiement Vercel API.";
    case "missing_api":
      return "URL API non configurée. Définissez EXPO_PUBLIC_API_URL=https://api.pastek-art.eu sur le projet web Vercel.";
    case "not_configured":
      return "L'API ne publie pas encore Supabase. Ajoutez SUPABASE_URL et SUPABASE_ANON_KEY sur le projet Vercel API, puis redéployez.";
    default:
      return "Configuration compte indisponible.";
  }
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
