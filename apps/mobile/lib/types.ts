export type ArtisticTechnique =
  | "drawing"
  | "painting"
  | "writing"
  | "mixed_media"
  | "recyclart";

export interface ExerciseResponse {
  exercise: string;
  durationMinutes: number;
  source: "ai" | "fallback";
}

export interface ReflectionResponse {
  reflection: string;
  openQuestions: string[];
  source: "ai" | "fallback";
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
