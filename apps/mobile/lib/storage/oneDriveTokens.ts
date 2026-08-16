/**
 * Jeton OneDrive / Microsoft Graph — stocké uniquement sur l'appareil.
 * Aucun secret côté Vercel (même modèle que kDrive).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const CREDENTIALS_KEY = "pastek_onedrive_credentials";
const META_KEY = "@art_therapie/onedrive_meta";

export type OneDriveCredentials = {
  /** Jeton d'accès Microsoft Graph (Files.ReadWrite). */
  accessToken: string;
};

export type OneDriveMeta = {
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

export async function saveOneDriveCredentials(
  credentials: OneDriveCredentials
): Promise<void> {
  await secureSet(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function loadOneDriveCredentials(): Promise<OneDriveCredentials | null> {
  const raw = await secureGet(CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OneDriveCredentials;
    if (!parsed.accessToken?.trim()) return null;
    return { accessToken: parsed.accessToken.trim() };
  } catch {
    return null;
  }
}

export async function clearOneDriveCredentials(): Promise<void> {
  await secureDelete(CREDENTIALS_KEY);
}

export async function saveOneDriveMeta(meta: OneDriveMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

export async function loadOneDriveMeta(): Promise<OneDriveMeta | null> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OneDriveMeta;
  } catch {
    return null;
  }
}

export async function clearOneDriveMeta(): Promise<void> {
  await AsyncStorage.removeItem(META_KEY);
}
