export type ArtisticTechnique =
  | "drawing"
  | "painting"
  | "writing"
  | "mixed_media"
  | "recyclart";

export interface ExerciseRequest {
  impulse: string;
  technique: ArtisticTechnique;
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
}

export interface AIProvider {
  generateExercise(input: ExerciseRequest): Promise<ExerciseResponse>;
  analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse>;
}

export interface ApiErrorBody {
  error: string;
  code: "RATE_LIMITED" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}
