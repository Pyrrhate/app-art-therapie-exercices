/**
 * Identifiants kDrive Infomaniak — stockés uniquement sur l'appareil.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const CREDENTIALS_KEY = "pastek_kdrive_credentials";
const META_KEY = "@art_therapie/kdrive_meta";

export type KDriveCredentials = {
  /** Jeton API Infomaniak (scope drive). */
  apiToken: string;
  /** Identifiant du kDrive (nombre dans l'URL /drive/…). */
  driveId: number;
};

export type KDriveMeta = {
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

export async function saveKDriveCredentials(
  credentials: KDriveCredentials
): Promise<void> {
  await secureSet(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function loadKDriveCredentials(): Promise<KDriveCredentials | null> {
  const raw = await secureGet(CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as KDriveCredentials;
    if (!parsed.apiToken?.trim() || !parsed.driveId) return null;
    return {
      apiToken: parsed.apiToken.trim(),
      driveId: Number(parsed.driveId),
    };
  } catch {
    return null;
  }
}

export async function clearKDriveCredentials(): Promise<void> {
  await secureDelete(CREDENTIALS_KEY);
}

export async function saveKDriveMeta(meta: KDriveMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

export async function loadKDriveMeta(): Promise<KDriveMeta | null> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KDriveMeta;
  } catch {
    return null;
  }
}

export async function clearKDriveMeta(): Promise<void> {
  await AsyncStorage.removeItem(META_KEY);
}
