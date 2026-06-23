import type { MultimodalUserAnswers } from "@/lib/multimodal/types";
import type { ArtisticTechnique } from "@/lib/types";
import type { RitualDuration } from "@/constants";

/** Parcours rapide ou profond. */
export type ExperienceMode = "express" | "deep";

export const EMPTY_INTEGRATION_ANSWERS: IntegrationAnswers = {
  resonance: "",
  intention: "",
  keeper: "",
};

/** Réponses post-analyse (intégration / clôture). */
export interface IntegrationAnswers {
  resonance: string;
  intention: string;
  keeper: string;
}

export type ReflectionWorkflowPhase =
  | "pre_analysis"
  | "capture"
  | "second_round_transition"
  | "post_integration"
  | "complete";

/** Réponses flash avant le 2e tour (réitération rapide). */
export interface SecondRoundTransitionAnswers {
  gestureChange: string;
  newIntention: string;
  physicalState: string;
}

export const EMPTY_SECOND_ROUND_ANSWERS: SecondRoundTransitionAnswers = {
  gestureChange: "",
  newIntention: "",
  physicalState: "",
};

export function secondRoundTransitionComplete(
  answers: SecondRoundTransitionAnswers
): boolean {
  return (
    answers.gestureChange.trim().length >= 2 &&
    answers.newIntention.trim().length >= 2 &&
    answers.physicalState.trim().length >= 2
  );
}

/** Signaux extraits du 1er tour pour guider l'augmentation du 2e. */
export interface EvolutionTriggers {
  blockages?: string[];
  dominantThemes?: string[];
  deepeningGoals?: string[];
  emotionalHighlights?: string[];
  rawSummary?: string;
}

/** Instantané figé du 1er tour avant le 2e (données préservées). */
export interface Round1Snapshot {
  exercise: string;
  reflection: string;
  openQuestions: string[];
  preAnswers?: MultimodalUserAnswers;
  postAnswers?: IntegrationAnswers;
  writtenText?: string;
  photoUri?: string | null;
  evolutionTriggers: EvolutionTriggers;
}

export interface Round1Data {
  media: string;
  writtenText?: string;
  preAnswers?: MultimodalUserAnswers;
  aiAnalysis: string;
  openQuestions: string[];
  reflectionSource: "ai" | "fallback";
  followUpExercise?: string | null;
  postAnswers?: IntegrationAnswers;
}

export interface Round2Data {
  media: string;
  writtenText?: string;
  transitionAnswers: SecondRoundTransitionAnswers;
  aiAnalysis: string;
  openQuestions: string[];
  reflectionSource: "ai" | "fallback";
}

export interface SessionData {
  exerciseId: string;
  round1: {
    media: string;
    preAnswers?: MultimodalUserAnswers;
    aiAnalysis: string;
    postAnswers?: IntegrationAnswers;
    writtenText?: string;
    openQuestions?: string[];
  };
  round2?: {
    media: string;
    transitionAnswers: SecondRoundTransitionAnswers;
    aiAnalysis: string;
    writtenText?: string;
    openQuestions?: string[];
  };
}

export function initialReflectionPhase(mode: ExperienceMode): ReflectionWorkflowPhase {
  return mode === "deep" ? "pre_analysis" : "capture";
}

export interface DeepSessionLog {
  id: string;
  createdAt: string;
  mode: "deep";
  exercise: {
    impulse: string;
    technique: ArtisticTechnique;
    techniqueLabel?: string;
    exercise: string;
    durationMinutes: RitualDuration;
  };
  /** Structure multi-tours (tour 1 seul ou tour 1 + tour 2). */
  sessionData?: SessionData;
  /** @deprecated Conservé pour rétrocompatibilité des journaux existants. */
  preAnalysis?: MultimodalUserAnswers;
  aiReflection?: {
    reflection: string;
    openQuestions: string[];
    source: "ai" | "fallback";
    followUpExercise?: string | null;
  };
  postIntegration: IntegrationAnswers;
  writtenText?: string;
  hasPhoto: boolean;
}
