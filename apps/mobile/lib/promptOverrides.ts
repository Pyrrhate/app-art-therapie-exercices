/**
 * Overrides locaux des prompts système (BYOP).
 * Stockés uniquement sur l'appareil — envoyés à l'API le temps d'une requête.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PROMPT_IDS,
  PROMPT_OVERRIDE_LIMITS,
  sanitizePromptOverrides,
  type PromptId,
  type PromptOverrides,
} from "@art-therapie/shared";

const STORAGE_KEY = "@art_therapie/prompt_overrides";

export async function getPromptOverrides(): Promise<PromptOverrides> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitizePromptOverrides(JSON.parse(raw)) ?? {};
  } catch {
    return {};
  }
}

export async function getPromptOverride(
  id: PromptId
): Promise<string | null> {
  const all = await getPromptOverrides();
  return all[id] ?? null;
}

export async function savePromptOverride(
  id: PromptId,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (trimmed.length < PROMPT_OVERRIDE_LIMITS.minLength) {
    throw new Error(
      `Le prompt doit contenir au moins ${PROMPT_OVERRIDE_LIMITS.minLength} caractères.`
    );
  }
  if (trimmed.length > PROMPT_OVERRIDE_LIMITS.maxLength) {
    throw new Error(
      `Le prompt ne peut pas dépasser ${PROMPT_OVERRIDE_LIMITS.maxLength} caractères.`
    );
  }
  const current = await getPromptOverrides();
  current[id] = trimmed;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export async function removePromptOverride(id: PromptId): Promise<void> {
  const current = await getPromptOverrides();
  delete current[id];
  if (Object.keys(current).length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export async function clearAllPromptOverrides(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function countPromptOverrides(): Promise<number> {
  const all = await getPromptOverrides();
  return PROMPT_IDS.filter((id) => Boolean(all[id])).length;
}
