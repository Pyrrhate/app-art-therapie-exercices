export type ArtisticTechnique =
  | "drawing"
  | "painting"
  | "writing"
  | "mixed_media"
  | "recyclart"
  | "collage"
  | "volume"
  | "video"
  | "music"
  | "dance"
  | "theatre";

export interface ExerciseResponse {
  exercise: string;
  durationMinutes: number;
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
  technique: ArtisticTechnique;
  exercise: string;
  durationMinutes: number;
  photoUri?: string;
  reflection?: string;
  openQuestions?: string[];
  writtenText?: string;
  followUpExercise?: string;
  createdAt: string;
}

export interface RitualState {
  impulse: string;
  technique: ArtisticTechnique | null;
  exercise: string;
  exerciseSource: "ai" | "fallback" | null;
  exerciseKeywords: string[];
  durationMinutes: number;
  photoUri: string | null;
  reflection: string | null;
  openQuestions: string[];
  followUpExercise: string | null;
  writtenText: string;
}
