/**
 * Google Gemini (Generative Language API) — BYOK.
 */

import { CREATIVE_COACH_SAFETY, resolvePromptText } from "@art-therapie/shared";
import { deriveExerciseKeywords } from "../exercise-keywords";
import { getFallbackExercise, getFallbackReflection } from "../fallbacks";
import { isAiAnalysisSupported } from "../techniques";
import type {
  AIProvider,
  ExerciseRequest,
  ExerciseResponse,
  ReflectionRequest,
  ReflectionResponse,
} from "../types";
import {
  buildExercisePrompt,
  buildHandwritingOcrPrompt,
  buildVisionObservationPrompt,
  buildWarmReflectionPrompt,
  buildWarmReflectionRetryPrompt,
  looksLikeColdDescription,
  looksLikeTooBriefReflection,
  parseExerciseFromAi,
  parseReflectionFromAi,
  type ReflectionPromptContext,
} from "./prompts";

const DEFAULT_MODEL = "gemini-2.5-flash";

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

function stripDataUrl(imageBase64: string): { mime: string; data: string } {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(imageBase64);
  if (m) return { mime: m[1], data: m[2] };
  return {
    mime: "image/jpeg",
    data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
  };
}

export type GeminiProviderOptions = {
  apiKey: string;
  model?: string;
};

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(options: GeminiProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.model = options.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.apiKey) {
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: "Aucune clé Gemini disponible.",
      };
    }

    try {
      const prompt = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext
      );
      const raw = await this.generate(
        resolvePromptText("exercise_system", input.promptOverrides),
        prompt,
        { temperature: 0.85, maxTokens: 700 }
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
          source: "ai",
        };
      }
      return {
        ...getFallbackExercise(input),
        source: "fallback",
        fallbackNote: "Gemini a répondu, format non exploitable.",
      };
    } catch (error) {
      console.warn("[Gemini generateExercise]", (error as Error).message);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: "Gemini indisponible — exercice local proposé.",
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (input.technique && !isAiAnalysisSupported(input.technique)) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "Technique sans analyse IA.",
      };
    }
    if (!this.apiKey) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "Clé Gemini manquante.",
      };
    }

    const isWriting = input.technique === "writing";
    let writtenText = input.writtenText?.trim() ?? "";

    try {
      let visualNotes: string | undefined;
      if (input.imageBase64) {
        visualNotes = await this.generateWithImage(
          buildVisionObservationPrompt(
            isWriting,
            input.exercise,
            input.promptOverrides
          ),
          input.imageBase64
        );
        if (isWriting && writtenText.length < 20) {
          try {
            const ocr = await this.generateWithImage(
              buildHandwritingOcrPrompt(input.promptOverrides),
              input.imageBase64
            );
            if (ocr.trim().length > 5) writtenText = ocr.trim();
          } catch {
            /* optionnel */
          }
        }
      }

      const promptCtx: ReflectionPromptContext = {
        visualNotes,
        impulse: input.impulse,
        technique: input.technique,
        exercise: input.exercise,
        writtenText: writtenText || undefined,
        durationMinutes: input.durationMinutes,
        colorContext: input.colorContext,
      };

      let warmRaw = await this.generate(
        resolvePromptText("reflection_system", input.promptOverrides),
        buildWarmReflectionPrompt(promptCtx),
        { temperature: 0.82, maxTokens: 950 }
      );
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.generate(
          resolvePromptText("reflection_system", input.promptOverrides),
          buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx),
          { temperature: 0.78, maxTokens: 950 }
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
      throw new Error("Réponse Gemini non exploitable");
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur Gemini";
      console.warn("[Gemini analyzeArtwork]", note);
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: note.slice(0, 400),
      };
    }
  }

  async transcribeHandwriting(
    imageBase64: string,
    options?: { promptOverrides?: import("@art-therapie/shared").PromptOverrides }
  ): Promise<{ text: string; source: "ai" | "fallback" }> {
    if (!this.apiKey) return { text: "", source: "fallback" };
    try {
      const text = await this.generateWithImage(
        buildHandwritingOcrPrompt(options?.promptOverrides),
        imageBase64
      );
      return { text: text.trim(), source: "ai" };
    } catch (error) {
      console.warn("[Gemini OCR]", (error as Error).message);
      return { text: "", source: "fallback" };
    }
  }

  private async generate(
    system: string,
    user: string,
    opts: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${CREATIVE_COACH_SAFETY}\n\n${system}` }],
        },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens ?? 512,
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.warn("[Gemini]", response.status, raw.slice(0, 200));
      throw new Error(`Gemini HTTP ${response.status}`);
    }
    const data = JSON.parse(raw) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini: réponse vide");
    return text;
  }

  private async generateWithImage(
    prompt: string,
    imageBase64: string
  ): Promise<string> {
    const { mime, data } = stripDataUrl(imageBase64);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: CREATIVE_COACH_SAFETY }],
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mime, data } },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(`Gemini vision HTTP ${response.status}`);
    const parsed = JSON.parse(raw) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = parsed.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini vision: vide");
    return text;
  }
}
