import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const DEFAULT_DEEP_QUESTIONS: Record<
  DeepQuestionKey,
  DeepQuestionOverride
> = {
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
  overrides?: DeepQuestionsOverrides | null
): Record<DeepQuestionKey, DeepQuestionOverride> {
  return {
    emotionalWord: {
      ...DEFAULT_DEEP_QUESTIONS.emotionalWord,
      ...overrides?.emotionalWord,
    },
    anchorMoment: {
      ...DEFAULT_DEEP_QUESTIONS.anchorMoment,
      ...overrides?.anchorMoment,
    },
    bodilyState: {
      ...DEFAULT_DEEP_QUESTIONS.bodilyState,
      ...overrides?.bodilyState,
    },
  };
}
