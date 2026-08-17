/**
 * Aleph Alpha (UE) — BYOK.
 * Priorité : chat/completions OpenAI-compat, puis API Complete historique.
 * https://docs.aleph-alpha.com/
 */

import { CREATIVE_COACH_SAFETY, resolvePromptText } from "@art-therapie/shared";
import { deriveExerciseKeywords } from "../exercise-keywords";
import { getFallbackExercise, getFallbackReflection } from "../fallbacks";
import type {
  AIProvider,
  CreativeTipsRequest,
  CreativeTipsResponse,
  ExerciseRequest,
  ExerciseResponse,
  ReflectionRequest,
  ReflectionResponse,
} from "../types";
import {
  getFallbackCreativeTips,
  runCreativeTipsGeneration,
} from "./creative-tips";
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
  resolveReflectionSystemPrompt,
  type ReflectionPromptContext,
} from "./prompts";

const HOST = "https://api.aleph-alpha.com";
const COMPLETE_URL = `${HOST}/complete`;
const CHAT_URLS = [`${HOST}/v1/chat/completions`, `${HOST}/chat/completions`];

/**
 * Ordre volontaire : control (instruction-following) d’abord,
 * puis modèles historiques encore documentés sur le client Python.
 */
const DEFAULT_MODELS = [
  "luminous-base-control",
  "luminous-extended-control",
  "luminous-supreme-control",
  "luminous-base",
  "luminous-extended",
  "pharia-1-llm-7b-control",
] as const;

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

function shouldTryNextModel(message: string): boolean {
  return /HTTP 404|HTTP 400|model_not_found|does not exist|unknown model|not found|not available|invalid.?model|no such model/i.test(
    message
  );
}

function shouldTryNextEndpoint(message: string): boolean {
  return /HTTP 404|HTTP 405|HTTP 501|not found|unsupported/i.test(message);
}

function alephHttpError(status: number, rawBody: string, model?: string): Error {
  let detail = `Aleph Alpha HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: string | { message?: string; code?: string };
      message?: string;
    };
    const msg =
      (typeof parsed.error === "string"
        ? parsed.error
        : parsed.error?.message?.trim()) || parsed.message?.trim();
    if (msg) detail = `Aleph Alpha HTTP ${status} — ${msg.slice(0, 220)}`;
  } catch {
    const snippet = rawBody.replace(/\s+/g, " ").trim().slice(0, 160);
    if (snippet) detail = `Aleph Alpha HTTP ${status} — ${snippet}`;
  }
  if (model && !detail.includes(model)) {
    detail = `${detail} (model: ${model})`;
  }
  return new Error(detail);
}

export type AlephAlphaProviderOptions = {
  apiKey: string;
  model?: string;
};

export class AlephAlphaProvider implements AIProvider {
  private apiKey: string;
  private models: string[];

  constructor(options: AlephAlphaProviderOptions) {
    this.apiKey = options.apiKey.trim();
    const preferred =
      options.model?.trim() || process.env.ALEPHALPHA_MODEL?.trim();
    this.models = [
      ...new Set(
        [preferred, ...DEFAULT_MODELS].filter(
          (m): m is string => Boolean(m && m.length > 0)
        )
      ),
    ];
  }

  async ping(): Promise<string> {
    return this.generate(
      "Répondez strictement: OK",
      "Répondez uniquement par le mot OK.",
      { maxTokens: 16, temperature: 0 }
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
        fallbackNote: "Aucune clé Aleph Alpha disponible.",
      };
    }

    try {
      const language = normalizePromptLanguage(input.language);
      const system = resolveExerciseSystemPrompt(input.promptOverrides, language, input.promptDials);
      const user = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext,
        language
      );
      const raw = await this.generate(system, `${user}\n\nJSON:`, {
        maxTokens: 800,
        temperature: 0.75,
      });
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
        fallbackNote: (error as Error).message.slice(0, 400),
      };
    }
  }

  async generateCreativeTips(
    input: CreativeTipsRequest
  ): Promise<CreativeTipsResponse> {
    if (!this.apiKey) {
      return {
        ...getFallbackCreativeTips(input),
        fallbackNote: "Aucune clé Aleph Alpha disponible.",
      };
    }
    try {
      return await runCreativeTipsGeneration(input, (user, system) =>
        this.generate(system, `${user}\n\nJSON:`, {
          maxTokens: 600,
          temperature: 0.75,
        })
      );
    } catch (error) {
      console.warn(
        "[AlephAlpha generateCreativeTips]",
        (error as Error).message
      );
      return {
        ...getFallbackCreativeTips(input),
        fallbackNote: (error as Error).message.slice(0, 400),
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

      const system = resolveReflectionSystemPrompt(input.promptOverrides, normalizePromptLanguage(input.language), input.promptDials);
      let warmRaw = await this.generate(
        system,
        `${buildWarmReflectionPrompt(promptCtx)}\n\nJSON:`,
        { maxTokens: 900, temperature: 0.75 }
      );
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.generate(
          system,
          `${buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx)}\n\nJSON:`,
          { maxTokens: 900, temperature: 0.72 }
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

  private async generate(
    system: string,
    user: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const maxTokens = options?.maxTokens ?? 800;
    const temperature = options?.temperature ?? 0.75;
    let lastError: Error | null = null;

    for (const model of this.models) {
      // 1) Chat OpenAI-compat (Pharia / stacks récents)
      try {
        return await this.chatCompletions(model, system, user, {
          maxTokens,
          temperature,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Auth / quota : inutile de continuer
        if (/HTTP 401|HTTP 403|unauthorized|invalid.?token|quota/i.test(lastError.message)) {
          throw lastError;
        }
      }

      // 2) API Complete historique (Luminous SaaS)
      try {
        return await this.complete(model, system, user, {
          maxTokens,
          temperature,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[AlephAlpha] modèle ${model}:`,
          lastError.message.slice(0, 180)
        );
        if (/HTTP 401|HTTP 403|unauthorized|invalid.?token|quota/i.test(lastError.message)) {
          throw lastError;
        }
        if (!shouldTryNextModel(lastError.message)) {
          // Erreur non liée au modèle : on tente quand même le modèle suivant
          // seulement si c’est clairement un problème de modèle / endpoint.
          if (!shouldTryNextEndpoint(lastError.message)) {
            /* continue to next model for resilience */
          }
        }
      }
    }

    throw lastError ?? new Error("Aleph Alpha: tous les modèles ont échoué");
  }

  private async chatCompletions(
    model: string,
    system: string,
    user: string,
    options: { maxTokens: number; temperature: number }
  ): Promise<string> {
    let lastError: Error | null = null;
    const messages = [
      { role: "system", content: `${CREATIVE_COACH_SAFETY}\n\n${system}` },
      { role: "user", content: user },
    ];

    for (const url of CHAT_URLS) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: options.maxTokens,
            temperature: options.temperature,
          }),
          signal: AbortSignal.timeout(90_000),
        });
        const raw = await response.text();
        if (!response.ok) {
          throw alephHttpError(response.status, raw, model);
        }
        const data = JSON.parse(raw) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error("Aleph Alpha chat: réponse vide");
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!shouldTryNextEndpoint(lastError.message)) throw lastError;
      }
    }

    throw lastError ?? new Error("Aleph Alpha chat indisponible");
  }

  private async complete(
    model: string,
    system: string,
    user: string,
    options: { maxTokens: number; temperature: number }
  ): Promise<string> {
    const prompt = `${CREATIVE_COACH_SAFETY}\n\n${system}\n\n${user}`;
    const response = await fetch(COMPLETE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        maximum_tokens: options.maxTokens,
        temperature: options.temperature,
        stop_sequences: ["\n\n\n"],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      throw alephHttpError(response.status, raw, model);
    }
    const data = JSON.parse(raw) as {
      completions?: Array<{ completion?: string }>;
    };
    const text = data.completions?.[0]?.completion?.trim();
    if (!text) throw new Error("Aleph Alpha: réponse vide");
    return text;
  }
}
