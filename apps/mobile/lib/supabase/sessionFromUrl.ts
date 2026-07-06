import * as QueryParams from "expo-auth-session/build/QueryParams";
import { getSupabaseClient } from "./client";

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

/** Échange le code PKCE ou les tokens présents dans l'URL de callback. */
export async function createSessionFromAuthUrl(url: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { params: queryParams, errorCode } = QueryParams.getQueryParams(url);
  const hashParams = parseHashParams(url);
  const params = { ...queryParams, ...hashParams };

  if (errorCode) {
    throw new Error(errorCode);
  }

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
