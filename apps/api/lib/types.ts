export type { ArtisticTechnique } from "@art-therapie/shared";
import type { PromptOverrides } from "@art-therapie/shared";

export interface ExerciseRequest {
  impulse: string;
  technique: import("@art-therapie/shared").ArtisticTechnique;
  /** Durée choisie par l'utilisateur·rice (prioritaire sur la suggestion IA). */
  durationMinutes?: number;
  /** Prompt d'augmentation pour le 2e tour (remplace le prompt standard). */
  augmentationContext?: string;
  /** Overrides locaux des prompts système (BYOP — jamais stockés serveur). */
  promptOverrides?: PromptOverrides;
}

export interface ExerciseResponse {
  exercise: string;
  /** Paragraphe qui développe les consignes (énoncé). */
  development?: string;
  durationMinutes: number;
  source: "ai" | "fallback";
  keywords: string[];
  /** Présent si BYOK a été tenté mais a échoué (message UX côté client). */
  fallbackNote?: string;
}

export interface ReflectionRequest {
  /** Image base64 — optionnelle si writtenText fourni (technique écriture). */
  imageBase64?: string;
  impulse?: string;
  technique?: import("@art-therapie/shared").ArtisticTechnique;
  /** Consigne d'exercice suivie par l'utilisateur·rice. */
  exercise?: string;
  durationMinutes?: number;
  /** Texte saisi ou issu de l'OCR (écriture). */
  writtenText?: string;
  /** Palette ou harmonie explorée avant le rituel (nuancier, palette intérieure). */
  colorContext?: string;
  /** Miroir précédent à approfondir. */
  previousReflection?: string;
  /** Échos du Fil créatif (traces locales) pour un miroir longitudinal. */
  practiceContext?: string;
  /** Overrides locaux des prompts système (BYOP — jamais stockés serveur). */
  promptOverrides?: PromptOverrides;
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

export interface HandwritingOcrRequest {
  imageBase64: string;
  promptOverrides?: PromptOverrides;
}

export interface AIProvider {
  generateExercise(input: ExerciseRequest): Promise<ExerciseResponse>;
  analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse>;
  transcribeHandwriting(
    imageBase64: string,
    options?: { promptOverrides?: PromptOverrides }
  ): Promise<HandwritingOcrResponse>;
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
