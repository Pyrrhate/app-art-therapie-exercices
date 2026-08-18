import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";
import type { RitualDuration } from "@/constants";
import type {
  ExperienceMode,
  IntegrationAnswers,
  ReflectionWorkflowPhase,
  Round1Snapshot,
  SecondRoundTransitionAnswers,
} from "@/lib/experience/types";
import type { MultimodalUserAnswers } from "@/lib/multimodal/types";

export type RitualDraftStep = "exercise" | "reflection";

/** État local + store de l'écran réflexion (reprise après navigation involontaire). */
export interface ReflectionDraftExtras {
  reflection?: string | null;
  openQuestions?: string[];
  followUpExercise?: string | null;
  experienceMode?: ExperienceMode;
  workflowPhase?: ReflectionWorkflowPhase;
  deepenedReflection?: string | null;
  deepenedOpenQuestions?: string[];
  reflectionSource?: "ai" | "fallback" | null;
  preAnswers?: MultimodalUserAnswers;
  postAnswers?: IntegrationAnswers;
  transitionAnswers?: SecondRoundTransitionAnswers;
  currentRound?: 1 | 2;
  isSecondRoundPrep?: boolean;
  round1Snapshot?: Round1Snapshot | null;
  useFilMemory?: boolean;
  sessionExerciseId?: string;
  filEntryId?: string | null;
}

export interface RitualDraft {
  impulse: string;
  technique: ArtisticTechnique;
  exercise: string;
  exerciseDevelopment?: string | null;
  moduleStatement?: string | null;
  exerciseKeywords?: string[];
  durationMinutes: RitualDuration;
  step: RitualDraftStep;
  photoUri?: string | null;
  writtenText?: string;
  colorContext?: string | null;
  paletteColors?: string[];
  seasonRunId?: string | null;
  seasonTitle?: string | null;
  reflectionExtras?: ReflectionDraftExtras;
  updatedAt: string;
}

export async function getRitualDraft(): Promise<RitualDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ritualDraft);
    if (!raw) return null;
    return JSON.parse(raw) as RitualDraft;
  } catch {
    return null;
  }
}

export async function saveRitualDraft(draft: RitualDraft): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ritualDraft, JSON.stringify(draft));
}

export async function clearRitualDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ritualDraft);
}
