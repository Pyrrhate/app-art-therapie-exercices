/**
 * Aleph Alpha (UE) — API Complete, BYOK.
 * https://docs.aleph-alpha.com/
 */

import { CREATIVE_COACH_SAFETY, resolvePromptText } from "@art-therapie/shared";
import { deriveExerciseKeywords } from "../exercise-keywords";
import { getFallbackExercise, getFallbackReflection } from "../fallbacks";
import type {
  AIProvider,
  ExerciseRequest,
  ExerciseResponse,
  ReflectionRequest,
  ReflectionResponse,
} from "../types";
import {
  buildExercisePrompt,
  buildWarmReflectionPrompt,
  buildWarmReflectionRetryPrompt,
  looksLikeColdDescription,
  looksLikeTooBriefReflection,
  parseExerciseFromAi,
  parseReflectionFromAi,
  type ReflectionPromptContext,
} from "./prompts";

const COMPLETE_URL = "https://api.aleph-alpha.com/complete";
const DEFAULT_MODEL = "luminous-base";

function ensureVouvoiementQuestion(question: string): string {
  return question
    .replace(/\bas-tu\b/gi, "avez-vous")
    .replace(/\bt'as\b/gi, "vous avez")
    .replace(/\bt'es\b/gi, "vous êtes")
    .replace(/\btu\b/gi, "vous")
    .replace(/\bton\b/gi, "votre")
    .replace(/\bta\b/gi, "votre")
    .replace(/\btes\b/gi, "vos");
}

export type AlephAlphaProviderOptions = {
  apiKey: string;
  model?: string;
};

export class AlephAlphaProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(options: AlephAlphaProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.model =
      options.model ?? process.env.ALEPHALPHA_MODEL ?? DEFAULT_MODEL;
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.apiKey) {
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: "Aucune clé Aleph Alpha disponible.",
      };
    }

    try {
      const system = resolvePromptText(
        "exercise_system",
        input.promptOverrides
      );
      const user = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext
      );
      const raw = await this.complete(
        `${CREATIVE_COACH_SAFETY}\n\n${system}\n\n${user}\n\nJSON:`
      );
      const parsed = parseExerciseFromAi(raw, preferredDuration);
      if (parsed) {
        const keywords =
          parsed.keywords.length > 0
            ? parsed.keywords
            : deriveExerciseKeywords(
                input.impulse,
                input.technique,
                parsed.exercise
              );
        return {
          exercise: parsed.exercise,
          durationMinutes: parsed.durationMinutes,
          keywords,
          ...(parsed.development ? { development: parsed.development } : {}),
          source: "ai",
        };
      }
      return {
        ...getFallbackExercise(input),
        source: "fallback",
        fallbackNote: "Aleph Alpha: format non exploitable.",
      };
    } catch (error) {
      console.warn("[AlephAlpha generateExercise]", (error as Error).message);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: "Aleph Alpha indisponible — exercice local.",
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (!this.apiKey) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "Clé Aleph Alpha manquante.",
      };
    }

    try {
      const promptCtx: ReflectionPromptContext = {
        impulse: input.impulse,
        technique: input.technique,
        exercise: input.exercise,
        writtenText: input.writtenText,
        durationMinutes: input.durationMinutes,
        colorContext: input.colorContext,
        previousReflection: input.previousReflection,
        practiceContext: input.practiceContext,
        visualNotes: input.imageBase64
          ? "(Image fournie — Aleph Alpha texte seul : décrivez librement votre ressenti.)"
          : undefined,
      };

      const system = resolvePromptText(
        "reflection_system",
        input.promptOverrides
      );
      let warmRaw = await this.complete(
        `${CREATIVE_COACH_SAFETY}\n\n${system}\n\n${buildWarmReflectionPrompt(promptCtx)}\n\nJSON:`
      );
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.complete(
          `${CREATIVE_COACH_SAFETY}\n\n${system}\n\n${buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx)}\n\nJSON:`
        );
        parsed = parseReflectionFromAi(warmRaw);
      }

      if (
        parsed?.reflection &&
        !looksLikeColdDescription(parsed.reflection) &&
        !looksLikeTooBriefReflection(parsed.reflection)
      ) {
        return {
          reflection: parsed.reflection,
          openQuestions: parsed.openQuestions.map(ensureVouvoiementQuestion),
          followUpExercise: parsed.followUpExercise,
          source: "ai",
        };
      }
      throw new Error("Réponse Aleph Alpha non exploitable");
    } catch (error) {
      const note =
        error instanceof Error ? error.message : "Erreur Aleph Alpha";
      console.warn("[AlephAlpha analyzeArtwork]", note);
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: note.slice(0, 400),
      };
    }
  }

  async transcribeHandwriting(): Promise<{
    text: string;
    source: "ai" | "fallback";
  }> {
    return { text: "", source: "fallback" };
  }

  private async complete(prompt: string): Promise<string> {
    const response = await fetch(COMPLETE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        maximum_tokens: 800,
        temperature: 0.75,
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.warn("[AlephAlpha]", response.status, raw.slice(0, 200));
      throw new Error(`Aleph Alpha HTTP ${response.status}`);
    }
    const data = JSON.parse(raw) as { completions?: Array<{ completion?: string }> };
    const text = data.completions?.[0]?.completion?.trim();
    if (!text) throw new Error("Aleph Alpha: réponse vide");
    return text;
  }
}
