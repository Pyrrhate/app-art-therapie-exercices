/**
 * Placeholder pour migration future vers Mistral Large (API européenne payante).
 * Implémenter generateExercise et analyzeArtwork en déléguant à l'API Mistral.
 */
import { getFallbackExercise, getFallbackReflection } from "../fallbacks";
import type {
  AIProvider,
  ExerciseRequest,
  ExerciseResponse,
  ReflectionRequest,
  ReflectionResponse,
} from "../types";

export class MistralProvider implements AIProvider {
  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    // TODO: implémenter avec MISTRAL_API_KEY
    console.warn("[MistralProvider] Non implémenté — fallback utilisé");
    return getFallbackExercise(input);
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    console.warn("[MistralProvider] Non implémenté — fallback utilisé");
    const fallback = getFallbackReflection(input);
    return { ...fallback, source: "fallback" };
  }
}
