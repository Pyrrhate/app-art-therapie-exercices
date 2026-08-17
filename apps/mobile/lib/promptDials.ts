/**
 * Affinage expérimental des prompts (potentiomètres).
 * Stockage local séparé des overrides texte.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PROMPT_DIALS_PAYLOAD,
  hasActivePromptDials,
  NEUTRAL_PROMPT_DIALS,
  sanitizePromptDials,
  type DialLevel,
  type PromptDialsPayload,
  type PromptDialsValues,
} from "@art-therapie/shared";

const STORAGE_KEY = "@art_therapie/prompt_dials_v1";

export type {
  DialLevel,
  PromptDialsPayload,
  PromptDialsValues,
};

export {
  DEFAULT_PROMPT_DIALS_PAYLOAD,
  hasActivePromptDials,
  NEUTRAL_PROMPT_DIALS,
};

export async function getPromptDials(): Promise<PromptDialsPayload> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROMPT_DIALS_PAYLOAD, values: { ...NEUTRAL_PROMPT_DIALS } };
    return (
      sanitizePromptDials(JSON.parse(raw)) ?? {
        ...DEFAULT_PROMPT_DIALS_PAYLOAD,
        values: { ...NEUTRAL_PROMPT_DIALS },
      }
    );
  } catch {
    return {
      ...DEFAULT_PROMPT_DIALS_PAYLOAD,
      values: { ...NEUTRAL_PROMPT_DIALS },
    };
  }
}

/** Payload à envoyer à l'API, ou undefined si inactif / tout neutre. */
export async function getActivePromptDialsForRequest(): Promise<
  PromptDialsPayload | undefined
> {
  const dials = await getPromptDials();
  if (!hasActivePromptDials(dials)) return undefined;
  return dials;
}

export async function savePromptDials(
  dials: PromptDialsPayload
): Promise<void> {
  const sanitized =
    sanitizePromptDials(dials) ?? {
      ...DEFAULT_PROMPT_DIALS_PAYLOAD,
      values: { ...NEUTRAL_PROMPT_DIALS },
    };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
}

export async function clearPromptDials(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
