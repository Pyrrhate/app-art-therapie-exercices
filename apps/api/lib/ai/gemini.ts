/**
 * Google Gemini (Generative Language API) — BYOK.
 * Thinking désactivé sur 2.5 (sinon maxOutputTokens part en « thoughts » → réponse vide).
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

/** Modèle principal + secours si 404 / retiré pour les nouveaux comptes. */
const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
] as const;

function modelsToTry(preferred: string): string[] {
  const ordered = [preferred, ...FALLBACK_MODELS];
  return [...new Set(ordered.filter(Boolean))];
}

/** Config thinking selon la famille de modèle (2.5 vs 3.x). */
function thinkingGenerationFields(model: string): Record<string, unknown> {
  if (/gemini-2\.5/i.test(model)) {
    return { thinkingConfig: { thinkingBudget: 0 } };
  }
  if (/gemini-3/i.test(model)) {
    return { thinkingConfig: { thinkingLevel: "minimal" } };
  }
  return {};
}

function shouldTryNextModel(message: string): boolean {
  return /HTTP 404|not found|is not found|not supported|UNKNOWN_MODEL|no longer available|deprecated|has been shut down/i.test(
    message
  );
}

function geminiHttpError(status: number, body: string): Error {
  let detail = `Gemini HTTP ${status}`;
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string; status?: string };
    };
    const msg = parsed.error?.message?.trim();
    if (msg) detail = `Gemini HTTP ${status} — ${msg.slice(0, 220)}`;
  } catch {
    const snippet = body.replace(/\s+/g, " ").trim().slice(0, 160);
    if (snippet) detail = `Gemini HTTP ${status} — ${snippet}`;
  }
  return new Error(detail);
}

function extractGeminiText(raw: string): string {
  const data = JSON.parse(raw) as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini a bloqué la requête (${data.promptFeedback.blockReason}).`
    );
  }

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini: aucun candidat dans la réponse");
  }

  const text = (candidate.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const reason = candidate.finishReason ?? "inconnu";
    throw new Error(
      `Gemini: réponse vide (finishReason=${reason}). Vérifiez la clé AI Studio (sans restriction IP/HTTP) et réessayez.`
    );
  }
  return text;
}

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

type GenerateOpts = {
  temperature?: number;
  maxTokens?: number;
  /** Force une réponse JSON (exercice / miroir). */
  json?: boolean;
};

export type GeminiProviderOptions = {
  apiKey: string;
  model?: string;
};

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(options: GeminiProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.model = options.model ?? PRIMARY_MODEL;
  }

  /** Smoke test léger — utilisé pour /api/ai/test. */
  async ping(): Promise<string> {
    return this.generate(
      "Répondez uniquement par le mot OK.",
      "ping",
      { temperature: 0, maxTokens: 16, json: false }
    );
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
        { temperature: 0.85, maxTokens: 2048, json: true }
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
        fallbackNote: "Gemini a répondu, format non exploitable.",
      };
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur Gemini";
      console.warn("[Gemini generateExercise]", note);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: note.slice(0, 400),
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
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
        previousReflection: input.previousReflection,
        practiceContext: input.practiceContext,
      };

      let warmRaw = await this.generate(
        resolvePromptText("reflection_system", input.promptOverrides),
        buildWarmReflectionPrompt(promptCtx),
        { temperature: 0.82, maxTokens: 4096, json: true }
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
          { temperature: 0.78, maxTokens: 4096, json: true }
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
    opts: GenerateOpts
  ): Promise<string> {
    const bodyBase = {
      systemInstruction: {
        parts: [{ text: `${CREATIVE_COACH_SAFETY}\n\n${system}` }],
      },
      contents: [{ role: "user", parts: [{ text: user }] }],
    };

    return this.requestWithModelFallback((model) => {
      const generationConfig: Record<string, unknown> = {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 2048,
      };
      if (opts.json) {
        generationConfig.responseMimeType = "application/json";
      }
      Object.assign(generationConfig, thinkingGenerationFields(model));
      return { ...bodyBase, generationConfig };
    });
  }

  private async generateWithImage(
    prompt: string,
    imageBase64: string
  ): Promise<string> {
    const { mime, data } = stripDataUrl(imageBase64);
    const bodyBase = {
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
    };

    return this.requestWithModelFallback((model) => {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.4,
        maxOutputTokens: 2048,
      };
      Object.assign(generationConfig, thinkingGenerationFields(model));
      return { ...bodyBase, generationConfig };
    });
  }

  /**
   * Essaie le modèle préféré puis les secours (404 / modèle inconnu).
   * Ne logue jamais la clé.
   */
  private async requestWithModelFallback(
    buildBody: (model: string) => Record<string, unknown>
  ): Promise<string> {
    const models = modelsToTry(this.model);
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        return await this.requestOnce(model, buildBody(model));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const msg = lastError.message;
        console.warn(`[Gemini] modèle ${model}:`, msg.slice(0, 180));
        if (!shouldTryNextModel(msg)) throw lastError;
      }
    }

    throw lastError ?? new Error("Gemini: tous les modèles ont échoué");
  }

  private async requestOnce(
    model: string,
    body: Record<string, unknown>
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      throw geminiHttpError(response.status, raw);
    }
    return extractGeminiText(raw);
  }
}
