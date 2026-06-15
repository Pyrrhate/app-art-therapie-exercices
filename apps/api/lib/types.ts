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
  /** Image base64 — optionnelle si writtenText fourni (technique écriture). */
  imageBase64?: string;
  impulse?: string;
  technique?: ArtisticTechnique;
  /** Consigne d'exercice suivie par l'utilisateur·rice. */
  exercise?: string;
  durationMinutes?: number;
  /** Texte saisi ou issu de l'OCR (écriture). */
  writtenText?: string;
}

export interface ReflectionResponse {
  reflection: string;
  openQuestions: string[];
  source: "ai" | "fallback";
  analysisNote?: string;
  /** Exercice de suite suggéré selon le vécu du rituel. */
  followUpExercise?: string;
}

export interface HandwritingOcrResponse {
  text: string;
  source: "ai" | "fallback";
}

export interface AIProvider {
  generateExercise(input: ExerciseRequest): Promise<ExerciseResponse>;
  analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse>;
  transcribeHandwriting(imageBase64: string): Promise<HandwritingOcrResponse>;
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
