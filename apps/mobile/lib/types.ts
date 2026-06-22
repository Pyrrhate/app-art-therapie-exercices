import type { ArtisticTechnique } from "@art-therapie/shared";
import type { RitualDuration } from "@art-therapie/shared";

export type { ArtisticTechnique } from "@art-therapie/shared";

export interface ExerciseResponse {
  exercise: string;
  durationMinutes: RitualDuration;
  source: "ai" | "fallback";
  keywords: string[];
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
  exercise: string;
  exerciseSource: "ai" | "fallback" | null;
  exerciseKeywords: string[];
  durationMinutes: RitualDuration;
  photoUri: string | null;
  reflection: string | null;
  openQuestions: string[];
  followUpExercise: string | null;
  writtenText: string;
}
