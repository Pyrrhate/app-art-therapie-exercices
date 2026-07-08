import * as QueryParams from "expo-auth-session/build/QueryParams";
import { Platform } from "react-native";
import { getSupabaseClient, initSupabaseClient } from "./client";

function parseUrlParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};

  try {
    const parsed = new URL(url);
    parsed.searchParams.forEach((value, key) => {
      out[key] = value;
    });

    const hash = parsed.hash.replace(/^#/, "");
    if (hash) {
      const hashQuery = hash.includes("?") ? hash.split("?").pop()! : hash;
      new URLSearchParams(hashQuery).forEach((value, key) => {
        out[key] = value;
      });
    }
  } catch {
    const { params: queryParams } = QueryParams.getQueryParams(url);
    Object.assign(out, queryParams);
  }

  return out;
}

function parseHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return {};

  const hash = url.slice(hashIndex + 1);
  const queryPart = hash.includes("?") ? hash.split("?").pop()! : hash;
  const params = new URLSearchParams(queryPart);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function readAuthParams(url: string): Record<string, string> {
  const { params: queryParams, errorCode } = QueryParams.getQueryParams(url);
  const hashParams = parseHashParams(url);
  const webParams = Platform.OS === "web" ? parseUrlParams(url) : {};
  const params = { ...queryParams, ...hashParams, ...webParams };

  if (errorCode) {
    throw new Error(errorCode);
  }

  const oauthError = params.error_description ?? params.error;
  if (oauthError) {
    throw new Error(oauthError);
  }

  return params;
}

/** Échange le code PKCE ou les tokens présents dans l'URL de callback (natif). */
export async function createSessionFromAuthUrl(url: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const params = readAuthParams(url);

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return true;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}

/**
 * Callback OAuth / magic link — attend la config Supabase puis la session.
 * (Sur le web, la config peut arriver via GET /api/config/public.)
 */
export async function completeAuthFromCallbackUrl(
  url: string
): Promise<boolean> {
  const configured = await initSupabaseClient();
  if (!configured) {
    throw new Error(
      "Service compte indisponible. Réessayez dans un instant."
    );
  }

  const supabase = getSupabaseClient();
  if (!supabase) return false;

  if (Platform.OS === "web") {
    const { error } = await supabase.auth.initialize();
    if (error) throw error;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    return Boolean(session);
  }

  if (url) {
    return createSessionFromAuthUrl(url);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}
