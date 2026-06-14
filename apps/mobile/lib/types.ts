export type ArtisticTechnique =
  | "drawing"
  | "painting"
  | "writing"
  | "mixed_media"
  | "recyclart"
  | "collage"
  | "volume";

export interface ExerciseResponse {
  exercise: string;
  durationMinutes: number;
  source: "ai" | "fallback";
}

export interface ReflectionResponse {
  reflection: string;
  openQuestions: string[];
  source: "ai" | "fallback";
  /** Détail technique si l'analyse IA a échoué (mode secours). */
  analysisNote?: string;
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
  createdAt: string;
}

export interface RitualState {
  impulse: string;
  technique: ArtisticTechnique | null;
  exercise: string;
  durationMinutes: number;
  photoUri: string | null;
  reflection: string | null;
  openQuestions: string[];
}
