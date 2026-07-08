import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ensureSupabaseConfigured,
  getSupabaseCredentials,
  resetSupabaseRemoteConfig,
} from "./config";

function getAuthStorage():
  | typeof AsyncStorage
  | Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage;
  }
  return AsyncStorage;
}

let client: SupabaseClient | null = null;
let clientKey = "";

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}

export async function initSupabaseClient(): Promise<boolean> {
  await ensureSupabaseConfigured();
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
        storage: getAuthStorage(),
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
    clientKey = cacheKey;
  }

  return client;
}
