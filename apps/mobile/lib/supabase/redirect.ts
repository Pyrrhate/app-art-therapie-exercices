import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";

function canonicalWebOrigin(): string {
  if (typeof window === "undefined") return "";

  const { protocol, hostname, origin } = window.location;
  if (hostname === "www.pastek-art.eu") {
    return `${protocol}//pastek-art.eu`;
  }
  return origin;
}

/** Évite de perdre le PKCE OAuth (localStorage lié à l'origine). */
export function ensureCanonicalWebOrigin(): boolean {
  if (typeof window === "undefined") return true;

  const { protocol, hostname, pathname, search, hash } = window.location;
  if (hostname !== "www.pastek-art.eu") return true;

  window.location.replace(
    `${protocol}//pastek-art.eu${pathname}${search}${hash}`
  );
  return false;
}

/** URL de retour OAuth / Magic Link (web, iOS, Android). */
export function getAuthRedirectUri(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${canonicalWebOrigin()}/auth/callback`;
  }

  return makeRedirectUri({
    scheme: "arttherapie",
    path: "auth/callback",
  });
}

export function parseAuthCallbackUrl(url: string): string | null {
  if (!url.includes("auth/callback")) return null;
  return url;
}

export async function getInitialAuthCallbackUrl(): Promise<string | null> {
  const initial = await Linking.getInitialURL();
  if (initial && parseAuthCallbackUrl(initial)) return initial;
  return null;
}
