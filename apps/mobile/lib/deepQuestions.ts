import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n/types";

const STORAGE_KEY = "@art_therapie/deep_questions_v1";

export type DeepQuestionKey =
  | "emotionalWord"
  | "anchorMoment"
  | "bodilyState";

export interface DeepQuestionOverride {
  label: string;
  placeholder: string;
  accessibilityLabel: string;
}

export type DeepQuestionsOverrides = Partial<
  Record<DeepQuestionKey, DeepQuestionOverride>
>;

type DeepQuestionDefaults = Record<DeepQuestionKey, DeepQuestionOverride>;

const FR_DEEP_QUESTIONS: DeepQuestionDefaults = {
  emotionalWord: {
    label: "Ressenti émotionnel",
    placeholder:
      "Un mot, une émotion qui émerge en repensant à votre geste ou performance…",
    accessibilityLabel:
      "Quel mot ou quelle émotion vous vient en repensant à votre geste ou performance",
  },
  anchorMoment: {
    label: "Le point d'ancrage",
    placeholder:
      "Un moment, un mouvement, un accord ou une couleur inattendu(e)…",
    accessibilityLabel:
      "Y a-t-il un moment précis qui a émergé de manière inattendue",
  },
  bodilyState: {
    label: "L'état physique",
    placeholder: "Comment votre corps se sent-il maintenant, par rapport au début ?",
    accessibilityLabel:
      "Comment vous sentez-vous corporellement maintenant par rapport au début de l'exercice",
  },
};

const EN_DEEP_QUESTIONS: DeepQuestionDefaults = {
  emotionalWord: {
    label: "How you feel",
    placeholder:
      "A word, an emotion that surfaces as you think back to your gesture or performance…",
    accessibilityLabel:
      "Which word or emotion comes to you as you think back to your gesture or performance",
  },
  anchorMoment: {
    label: "The anchor point",
    placeholder:
      "A moment, a movement, a chord or a colour that came unexpectedly…",
    accessibilityLabel:
      "Was there a precise moment that emerged unexpectedly",
  },
  bodilyState: {
    label: "How your body feels",
    placeholder: "How does your body feel now, compared with the beginning?",
    accessibilityLabel:
      "How does your body feel now compared with the start of the exercise",
  },
};

export const DEEP_QUESTIONS_BY_LANGUAGE: Record<
  AppLanguage,
  DeepQuestionDefaults
> = {
  fr: FR_DEEP_QUESTIONS,
  en: EN_DEEP_QUESTIONS,
};

/** Questions par défaut (FR) — base de comparaison historique des overrides. */
export const DEFAULT_DEEP_QUESTIONS = FR_DEEP_QUESTIONS;

/** Questions par défaut pour la langue de l'interface. */
export function getDefaultDeepQuestions(language?: string): DeepQuestionDefaults {
  const lang = (language ?? i18n.language)?.slice(0, 2);
  return lang === "en" ? EN_DEEP_QUESTIONS : FR_DEEP_QUESTIONS;
}

export const DEEP_QUESTION_KEYS: DeepQuestionKey[] = [
  "emotionalWord",
  "anchorMoment",
  "bodilyState",
];

export async function getDeepQuestionsOverrides(): Promise<DeepQuestionsOverrides> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DeepQuestionsOverrides;
    const result: DeepQuestionsOverrides = {};
    for (const key of DEEP_QUESTION_KEYS) {
      const entry = parsed[key];
      if (
        entry &&
        typeof entry.label === "string" &&
        entry.label.trim().length >= 2 &&
        typeof entry.placeholder === "string"
      ) {
        result[key] = {
          label: entry.label.trim(),
          placeholder: entry.placeholder.trim(),
          accessibilityLabel:
            entry.accessibilityLabel?.trim() || entry.placeholder.trim(),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function saveDeepQuestionsOverrides(
  overrides: DeepQuestionsOverrides
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export async function clearDeepQuestionsOverrides(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function resolveDeepQuestions(
  overrides?: DeepQuestionsOverrides | null,
  language?: string
): Record<DeepQuestionKey, DeepQuestionOverride> {
  const defaults = getDefaultDeepQuestions(language);
  return {
    emotionalWord: {
      ...defaults.emotionalWord,
      ...overrides?.emotionalWord,
    },
    anchorMoment: {
      ...defaults.anchorMoment,
      ...overrides?.anchorMoment,
    },
    bodilyState: {
      ...defaults.bodilyState,
      ...overrides?.bodilyState,
    },
  };
}
