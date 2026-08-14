/**
 * Ollama local — BYOK via URL de base (ex. http://localhost:11434).
 * Le champ « clé » côté client contient l’URL ; jamais persistée serveur.
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
  normalizePromptLanguage,
  parseExerciseFromAi,
  parseReflectionFromAi,
  resolveExerciseSystemPrompt,
  type ReflectionPromptContext,
} from "./prompts";

const DEFAULT_MODEL = "llama3.2";

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

export type OllamaProviderOptions = {
  /** Base URL Ollama, ex. http://127.0.0.1:11434 */
  baseUrl: string;
  model?: string;
};

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "").trim();
    this.model = options.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.baseUrl) {
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: "URL Ollama manquante.",
      };
    }

    try {
      const language = normalizePromptLanguage(input.language);
      const prompt = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext,
        language
      );
      const raw = await this.chat(
        resolveExerciseSystemPrompt(input.promptOverrides, language),
        prompt
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
        fallbackNote: "Ollama: format non exploitable.",
      };
    } catch (error) {
      console.warn("[Ollama generateExercise]", (error as Error).message);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote:
          "Ollama injoignable. Vérifiez que le service tourne et l’URL (ex. http://127.0.0.1:11434).",
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (!this.baseUrl) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "URL Ollama manquante.",
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
          ? "(Image fournie — Ollama texte : appuyez-vous sur le ressenti décrit.)"
          : undefined,
      };

      const system = resolvePromptText(
        "reflection_system",
        input.promptOverrides
      );
      let warmRaw = await this.chat(
        system,
        buildWarmReflectionPrompt(promptCtx)
      );
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.chat(
          system,
          buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx)
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
      throw new Error("Réponse Ollama non exploitable");
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur Ollama";
      console.warn("[Ollama analyzeArtwork]", note);
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

  private async chat(system: string, user: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          {
            role: "system",
            content: `${CREATIVE_COACH_SAFETY}\n\n${system}`,
          },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.warn("[Ollama]", response.status, raw.slice(0, 200));
      throw new Error(`Ollama HTTP ${response.status}`);
    }
    const data = JSON.parse(raw) as {
      message?: { content?: string };
      response?: string;
    };
    const text = (data.message?.content ?? data.response ?? "").trim();
    if (!text) throw new Error("Ollama: réponse vide");
    return text;
  }
}
