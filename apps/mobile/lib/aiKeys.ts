/**
 * BYOK — clés API stockées uniquement sur l'appareil.
 * Le backend Pastek Art ne reçoit les clés que le temps d'un relay HTTP ;
 * elles ne sont jamais persistées côté serveur.
 *
 * Native (iOS/Android) : expo-secure-store (Keychain / Keystore).
 * Web : AsyncStorage (limitation navigateur — moins isolé qu'un coffre natif).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  BYOK_PROVIDER_IDS,
  type ByokProviderId,
} from "@art-therapie/shared";

export type AiKeyProvider = ByokProviderId;

export const AI_KEY_PROVIDERS: readonly AiKeyProvider[] = BYOK_PROVIDER_IDS;

const KEY_PREFIX = "pastek_ai_key_";
const SELECTED_PROVIDER_KEY = "@art_therapie/ai_selected_provider";

function storageKey(provider: AiKeyProvider): string {
  return `${KEY_PREFIX}${provider}`;
}

function assertProvider(provider: string): asserts provider is AiKeyProvider {
  if (!AI_KEY_PROVIDERS.includes(provider as AiKeyProvider)) {
    throw new Error(`Fournisseur IA inconnu : ${provider}`);
  }
}

function sanitizeKey(key: string): string {
  return key.trim();
}

function minKeyLength(provider: AiKeyProvider): number {
  return provider === "ollama" ? 7 : 8;
}

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
    const fromSecure = await SecureStore.getItemAsync(key);
    if (fromSecure) return fromSecure;
  } catch {
    /* AsyncStorage ci-dessous */
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
    /* ignorer */
  }
  await AsyncStorage.removeItem(key);
}

/** Enregistre une clé API (ou URL Ollama) localement. */
export async function saveAiKey(
  provider: AiKeyProvider,
  key: string
): Promise<void> {
  assertProvider(provider);
  const trimmed = sanitizeKey(key);
  if (trimmed.length < minKeyLength(provider)) {
    throw new Error(
      provider === "ollama"
        ? "Indiquez l’URL Ollama (ex. http://127.0.0.1:11434)."
        : "La clé API semble trop courte. Vérifiez la copie."
    );
  }
  await secureSet(storageKey(provider), trimmed);
}

export async function getAiKey(
  provider: AiKeyProvider
): Promise<string | null> {
  assertProvider(provider);
  const value = await secureGet(storageKey(provider));
  return value?.trim() || null;
}

export async function hasAiKey(provider: AiKeyProvider): Promise<boolean> {
  const key = await getAiKey(provider);
  return Boolean(key);
}

export async function removeAiKey(provider: AiKeyProvider): Promise<void> {
  assertProvider(provider);
  await secureDelete(storageKey(provider));
}

export async function removeAllAiKeys(): Promise<void> {
  await Promise.all(AI_KEY_PROVIDERS.map((p) => removeAiKey(p)));
  await AsyncStorage.removeItem(SELECTED_PROVIDER_KEY);
}

export async function getSelectedAiProvider(): Promise<AiKeyProvider> {
  try {
    const value = await AsyncStorage.getItem(SELECTED_PROVIDER_KEY);
    if (value && AI_KEY_PROVIDERS.includes(value as AiKeyProvider)) {
      return value as AiKeyProvider;
    }
  } catch {
    /* optionnel */
  }
  return "mistral";
}

export async function setSelectedAiProvider(
  provider: AiKeyProvider
): Promise<void> {
  assertProvider(provider);
  await AsyncStorage.setItem(SELECTED_PROVIDER_KEY, provider);
}

export async function resolveByokCredentials(): Promise<{
  provider: AiKeyProvider;
  key: string;
} | null> {
  const preferred = await getSelectedAiProvider();
  const preferredKey = await getAiKey(preferred);
  if (preferredKey) {
    return { provider: preferred, key: preferredKey };
  }

  for (const provider of AI_KEY_PROVIDERS) {
    const key = await getAiKey(provider);
    if (key) return { provider, key };
  }
  return null;
}
