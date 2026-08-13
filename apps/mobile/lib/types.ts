import type { ArtisticTechnique } from "@art-therapie/shared";
import type { RitualDuration } from "@art-therapie/shared";
import type {
  ExperienceMode,
  IntegrationAnswers,
  Round1Snapshot,
  SecondRoundTransitionAnswers,
  EvolutionTriggers,
} from "@/lib/experience/types";
import type { CustomSessionConfig } from "@/lib/custom/types";
import type { MultimodalUserAnswers } from "@/lib/multimodal/types";

export type { ArtisticTechnique } from "@art-therapie/shared";
export type { CustomSessionConfig };

export interface ExerciseResponse {
  exercise: string;
  /** Paragraphe qui développe les consignes (énoncé). */
  development?: string;
  durationMinutes: RitualDuration;
  source: "ai" | "fallback";
  keywords: string[];
  /** Présent si une clé perso (BYOK) a échoué — message UX. */
  fallbackNote?: string;
}

export interface ReflectionResponse {
  reflection: string;
  openQuestions: string[];
  source: "ai" | "fallback";
  /** Détail technique si l'analyse IA a échoué (mode secours). */
  analysisNote?: string;
  followUpExercise?: string;
}

export interface SavedSession {
  id: string;
  impulse: string;
  technique: import("@art-therapie/shared").ArtisticTechnique;
  exercise: string;
  durationMinutes: RitualDuration;
  photoUri?: string;
  reflection?: string;
  openQuestions?: string[];
  writtenText?: string;
  followUpExercise?: string;
  createdAt: string;
}

export interface RitualState {
  impulse: string;
  technique: import("@art-therapie/shared").ArtisticTechnique | null;
  /** Libellé affiché (technique custom ou libellé overridé). */
  techniqueLabel: string | null;
  exercise: string;
  /** Développement des consignes (énoncé). */
  exerciseDevelopment: string | null;
  /** Texte des modules d'impulsion — visible en énoncé, jamais envoyé comme directive IA. */
  moduleStatement: string | null;
  exerciseSource: "ai" | "fallback" | null;
  /** Message UX si fallback après tentative BYOK (sinon null). */
  exerciseFallbackNote: string | null;
  exerciseKeywords: string[];
  durationMinutes: RitualDuration;
  photoUri: string | null;
  reflection: string | null;
  openQuestions: string[];
  followUpExercise: string | null;
  writtenText: string;
  experienceMode: ExperienceMode;
  preAnswers: MultimodalUserAnswers;
  postAnswers: IntegrationAnswers;
  currentRound: 1 | 2;
  isSecondRoundPrep: boolean;
  round1Snapshot: Round1Snapshot | null;
  transitionAnswers: SecondRoundTransitionAnswers;
  evolutionTriggers: EvolutionTriggers | null;
  isExerciseAugmented: boolean;
  sessionExerciseId: string;
  customSessionConfig: CustomSessionConfig;
  /** Contexte chromatique amont (palette, harmonie) pour la réflexion IA. */
  colorContext: string | null;
  /** Hex de la palette explorée — affichage Fil et réutilisation. */
  paletteColors: string[];
  seasonRunId: string | null;
  seasonTitle: string | null;
}
