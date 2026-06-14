export type ArtisticTechnique =
  | "drawing"
  | "painting"
  | "writing"
  | "mixed_media"
  | "recyclart"
  | "collage"
  | "volume";

export interface ExerciseRequest {
  impulse: string;
  technique: ArtisticTechnique;
  /** Durée choisie par l'utilisateur·rice (prioritaire sur la suggestion IA). */
  durationMinutes?: number;
}

export interface ExerciseResponse {
  exercise: string;
  durationMinutes: number;
  source: "ai" | "fallback";
}

export interface ReflectionRequest {
  imageBase64: string;
  impulse?: string;
  technique?: ArtisticTechnique;
}

export interface ReflectionResponse {
  reflection: string;
  openQuestions: string[];
  source: "ai" | "fallback";
  analysisNote?: string;
}

export interface AIProvider {
  generateExercise(input: ExerciseRequest): Promise<ExerciseResponse>;
  analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse>;
}

export interface ApiErrorBody {
  error: string;
  code:
    | "RATE_LIMITED"
    | "VALIDATION_ERROR"
    | "INTERNAL_ERROR"
    | "IMAGE_TOO_LARGE"
    | "AI_NOT_CONFIGURED";
}
