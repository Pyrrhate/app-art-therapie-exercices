/**
 * Tokens Google Drive — stockés uniquement sur l'appareil (zéro connaissance serveur).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "pastek_gdrive_oauth";
const META_KEY = "@art_therapie/gdrive_meta";

export type GoogleDriveTokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
};

export type GoogleDriveMeta = {
  connectedAt: string;
  lastSyncAt: string | null;
  accountHint?: string | null;
};

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }
  try {
    const v = await SecureStore.getItemAsync(key);
    if (v) return v;
  } catch {
    /* fallback */
  }
  return AsyncStorage.getItem(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignore */
  }
  await AsyncStorage.removeItem(key);
}

export async function saveGoogleDriveTokens(
  tokens: GoogleDriveTokenBundle
): Promise<void> {
  await secureSet(TOKEN_KEY, JSON.stringify(tokens));
}

export async function loadGoogleDriveTokens(): Promise<GoogleDriveTokenBundle | null> {
  const raw = await secureGet(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GoogleDriveTokenBundle;
    if (!parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearGoogleDriveTokens(): Promise<void> {
  await secureDelete(TOKEN_KEY);
}

export async function saveGoogleDriveMeta(
  meta: GoogleDriveMeta
): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

export async function loadGoogleDriveMeta(): Promise<GoogleDriveMeta | null> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleDriveMeta;
  } catch {
    return null;
  }
}

export async function clearGoogleDriveMeta(): Promise<void> {
  await AsyncStorage.removeItem(META_KEY);
}
