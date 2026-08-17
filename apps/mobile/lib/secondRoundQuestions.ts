import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n/types";
import type { SecondRoundTransitionAnswers } from "@/lib/experience/types";

const STORAGE_KEY = "@art_therapie/second_round_questions_v1";

export type SecondRoundQuestionKey = keyof SecondRoundTransitionAnswers;

export interface SecondRoundQuestionOverride {
  label: string;
  placeholder: string;
  accessibilityLabel: string;
}

export type SecondRoundQuestionsOverrides = Partial<
  Record<SecondRoundQuestionKey, SecondRoundQuestionOverride>
>;

type SecondRoundQuestionDefaults = Record<
  SecondRoundQuestionKey,
  SecondRoundQuestionOverride
>;

const FR_SECOND_ROUND_QUESTIONS: SecondRoundQuestionDefaults = {
  gestureChange: {
    label: "Changement de geste",
    placeholder:
      "Qu'aimeriez-vous faire différemment dans ce second passage ?",
    accessibilityLabel:
      "Qu'aimeriez-vous faire différemment dans ce second passage",
  },
  newIntention: {
    label: "Nouvelle intention",
    placeholder: "Quelle intention portez-vous pour ce 2e tour ?",
    accessibilityLabel: "Quelle intention portez-vous pour ce deuxième tour",
  },
  physicalState: {
    label: "Ressenti corporel",
    placeholder: "Comment se sent votre corps en ce moment ?",
    accessibilityLabel: "Comment se sent votre corps en ce moment",
  },
};

const EN_SECOND_ROUND_QUESTIONS: SecondRoundQuestionDefaults = {
  gestureChange: {
    label: "A change of gesture",
    placeholder: "What would you like to do differently in this second round?",
    accessibilityLabel:
      "What would you like to do differently in this second round",
  },
  newIntention: {
    label: "A new intention",
    placeholder: "What intention are you carrying into this second round?",
    accessibilityLabel:
      "What intention are you carrying into this second round",
  },
  physicalState: {
    label: "How your body feels",
    placeholder: "How does your body feel right now?",
    accessibilityLabel: "How does your body feel right now",
  },
};

export const SECOND_ROUND_QUESTIONS_BY_LANGUAGE: Record<
  AppLanguage,
  SecondRoundQuestionDefaults
> = {
  fr: FR_SECOND_ROUND_QUESTIONS,
  en: EN_SECOND_ROUND_QUESTIONS,
};

export function getDefaultSecondRoundQuestions(
  language?: string
): SecondRoundQuestionDefaults {
  const lang = (language ?? i18n.language)?.slice(0, 2);
  return lang === "en" ? EN_SECOND_ROUND_QUESTIONS : FR_SECOND_ROUND_QUESTIONS;
}

export const SECOND_ROUND_QUESTION_KEYS: SecondRoundQuestionKey[] = [
  "gestureChange",
  "newIntention",
  "physicalState",
];

export async function getSecondRoundQuestionsOverrides(): Promise<SecondRoundQuestionsOverrides> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SecondRoundQuestionsOverrides;
    const result: SecondRoundQuestionsOverrides = {};
    for (const key of SECOND_ROUND_QUESTION_KEYS) {
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

export async function saveSecondRoundQuestionsOverrides(
  overrides: SecondRoundQuestionsOverrides
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export async function clearSecondRoundQuestionsOverrides(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function resolveSecondRoundQuestions(
  overrides?: SecondRoundQuestionsOverrides | null,
  language?: string
): Record<SecondRoundQuestionKey, SecondRoundQuestionOverride> {
  const defaults = getDefaultSecondRoundQuestions(language);
  return {
    gestureChange: {
      ...defaults.gestureChange,
      ...overrides?.gestureChange,
    },
    newIntention: {
      ...defaults.newIntention,
      ...overrides?.newIntention,
    },
    physicalState: {
      ...defaults.physicalState,
      ...overrides?.physicalState,
    },
  };
}
