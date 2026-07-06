import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import {
  ensureSupabaseConfigured,
  getSupabaseCredentials,
  resetSupabaseRemoteConfig,
} from "./config";

let client: SupabaseClient | null = null;
let clientKey = "";

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}

export async function initSupabaseClient(): Promise<boolean> {
  await ensureSupabaseConfigured();
  if (isSupabaseConfigured()) {
    client = null;
    clientKey = "";
  }
  return isSupabaseConfigured();
}

export function resetSupabaseClient(): void {
  client = null;
  clientKey = "";
  resetSupabaseRemoteConfig();
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  const cacheKey = `${url}|${anonKey}`;
  if (!client || clientKey !== cacheKey) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
    clientKey = cacheKey;
  }

  return client;
}
