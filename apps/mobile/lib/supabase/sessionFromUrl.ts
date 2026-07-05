import * as QueryParams from "expo-auth-session/build/QueryParams";
import { getSupabaseClient } from "./client";

/** Échange le code PKCE ou les tokens présents dans l'URL de callback. */
export async function createSessionFromAuthUrl(url: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { params, errorCode } = QueryParams.getQueryParams(url);
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

  return false;
}
