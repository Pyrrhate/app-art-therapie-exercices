/**
 * Provider OpenAI-compatible (chat/completions) — Scaleway, OVHcloud, OpenAI, etc.
 * Clé jamais loguée ; ton créatif non clinique injecté dans le system prompt.
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
  buildHandwritingOcrPrompt,
  buildVisionObservationPrompt,
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

export interface OpenAICompatibleOptions {
  label: string;
  baseUrl: string;
  apiKey: string;
  textModel: string;
  visionModel?: string;
  /** Modèles de secours si le principal est 404 / indisponible. */
  fallbackModels?: string[];
  /** Fallbacks dédiés vision (sinon = fallbackModels). */
  visionFallbackModels?: string[];
  /** true = pas de vision (texte seul + fallback OCR). */
  textOnly?: boolean;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

function toDataImageUrl(imageBase64: string): string {
  if (imageBase64.startsWith("data:")) return imageBase64;
  return `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, "")}`;
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

function withSafety(system?: string): string {
  const base = system?.trim() || "";
  return base
    ? `${CREATIVE_COACH_SAFETY}\n\n${base}`
    : CREATIVE_COACH_SAFETY;
}

function compatibleHttpError(
  label: string,
  status: number,
  rawBody: string,
  model?: string
): Error {
  let detail = `${label} HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: { message?: string; type?: string; code?: string } | string;
      message?: string;
    };
    const msg =
      (typeof parsed.error === "string"
        ? parsed.error
        : parsed.error?.message?.trim()) || parsed.message?.trim();
    if (msg) detail = `${label} HTTP ${status} — ${msg.slice(0, 220)}`;
  } catch {
    const snippet = rawBody.replace(/\s+/g, " ").trim().slice(0, 160);
    if (snippet) detail = `${label} HTTP ${status} — ${snippet}`;
  }
  if (model && !detail.includes(model)) {
    detail = `${detail} (model: ${model})`;
  }
  return new Error(detail);
}

function shouldTryNextModel(message: string): boolean {
  return /HTTP 404|HTTP 400|model_not_found|does not exist|not found|unknown model|not available|no longer|unavailable|retired|deprecated|invalid.?model|model.?id|does not support|not supported for/i.test(
    message
  );
}

export class OpenAICompatibleProvider implements AIProvider {
  private readonly label: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly textModel: string;
  private readonly visionModel: string;
  private readonly fallbackModels: string[];
  private readonly visionFallbackModels: string[];
  private readonly textOnly: boolean;

  constructor(options: OpenAICompatibleOptions) {
    this.label = options.label;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey.trim();
    this.textModel = options.textModel;
    this.visionModel = options.visionModel ?? options.textModel;
    this.fallbackModels = options.fallbackModels ?? [];
    this.visionFallbackModels =
      options.visionFallbackModels ?? this.fallbackModels;
    this.textOnly = options.textOnly ?? false;
  }

  async ping(): Promise<string> {
    return this.callText("Répondez uniquement par le mot OK.", {
      maxTokens: 16,
      temperature: 0,
      systemPrompt: "Répondez strictement: OK",
    });
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.apiKey) {
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: `Aucune clé ${this.label} disponible.`,
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
      const raw = await this.callText(prompt, {
        systemPrompt: resolveExerciseSystemPrompt(
          input.promptOverrides,
          language
        ),
        temperature: 0.85,
        maxTokens: 700,
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
        fallbackNote: `${this.label} a répondu, mais le format n’était pas exploitable.`,
      };
    } catch (error) {
      const note =
        error instanceof Error
          ? error.message
          : `${this.label} indisponible — exercice local proposé.`;
      console.warn(`[${this.label} generateExercise]`, note);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: note.slice(0, 400),
      };
    }
  }

  async generateCreativeTips(
    input: CreativeTipsRequest
  ): Promise<CreativeTipsResponse> {
    if (!this.apiKey) {
      return {
        ...getFallbackCreativeTips(input),
        fallbackNote: `Aucune clé ${this.label} disponible.`,
      };
    }
    try {
      return await runCreativeTipsGeneration(input, (user, system) =>
        this.callText(user, {
          systemPrompt: system,
          maxTokens: 600,
          temperature: 0.8,
        })
      );
    } catch (error) {
      const note =
        error instanceof Error ? error.message : `Erreur ${this.label}`;
      console.warn(`[${this.label} generateCreativeTips]`, note);
      return {
        ...getFallbackCreativeTips(input),
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
        analysisNote: `Clé ${this.label} manquante.`,
      };
    }

    const isWriting = input.technique === "writing";
    let writtenText = input.writtenText?.trim() ?? "";

    try {
      let visualNotes: string | undefined;

      if (input.imageBase64 && !this.textOnly) {
        visualNotes = await this.callVision(
          input.imageBase64,
          buildVisionObservationPrompt(
            isWriting,
            input.exercise,
            input.promptOverrides
          )
        );

        if (isWriting && writtenText.length < 20) {
          try {
            const ocr = await this.callVision(
              input.imageBase64,
              buildHandwritingOcrPrompt(input.promptOverrides)
            );
            const transcribed = ocr.trim();
            if (transcribed.length > 5) writtenText = transcribed;
          } catch {
            /* OCR optionnel */
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

      let warmRaw = await this.callText(buildWarmReflectionPrompt(promptCtx), {
        temperature: 0.82,
        maxTokens: 950,
        systemPrompt: resolvePromptText(
          "reflection_system",
          input.promptOverrides
        ),
      });
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.callText(
          buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx),
          {
            temperature: 0.78,
            maxTokens: 950,
            systemPrompt: resolvePromptText(
              "reflection_system",
              input.promptOverrides
            ),
          }
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

      throw new Error(`Réponse ${this.label} non exploitable`);
    } catch (error) {
      const note = error instanceof Error ? error.message : `Erreur ${this.label}`;
      console.warn(`[${this.label} analyzeArtwork]`, note);
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
    if (!this.apiKey || this.textOnly) return { text: "", source: "fallback" };

    try {
      const text = await this.callVision(
        imageBase64,
        buildHandwritingOcrPrompt(options?.promptOverrides)
      );
      return { text: text.trim(), source: "ai" };
    } catch (error) {
      console.warn(`[${this.label} OCR]`, (error as Error).message);
      return { text: "", source: "fallback" };
    }
  }

  private async callText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: withSafety(options?.systemPrompt) },
      { role: "user", content: prompt },
    ];
    return this.chatWithFallback(
      [this.textModel, ...this.fallbackModels],
      messages,
      options
    );
  }

  private async callVision(imageBase64: string, prompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: toDataImageUrl(imageBase64) } },
        ],
      },
    ];
    return this.chatWithFallback(
      [this.visionModel, ...this.visionFallbackModels],
      messages,
      {
        maxTokens: 1024,
        temperature: 0.4,
      }
    );
  }

  private async chatWithFallback(
    models: string[],
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const ordered = [...new Set(models.filter(Boolean))];
    let lastError: Error | null = null;

    for (const model of ordered) {
      try {
        return await this.chat(messages, model, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[${this.label}] modèle ${model}:`,
          lastError.message.slice(0, 180)
        );
        if (!shouldTryNextModel(lastError.message)) throw lastError;
      }
    }

    throw lastError ?? new Error(`${this.label}: tous les modèles ont échoué`);
  }

  private async chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.7,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn(
        `[${this.label} chat] ${response.status}:`,
        rawBody.slice(0, 200)
      );
      throw compatibleHttpError(this.label, response.status, rawBody, model);
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error(`${this.label}: réponse vide`);
    return content;
  }
}

/** Smoke test chat/completions — ne logue pas la clé. */
export async function testOpenAICompatibleConnection(options: {
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const provider = new OpenAICompatibleProvider({
      label: options.label,
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      textModel: options.model,
      textOnly: true,
    });
    const reply = await provider.ping();
    const ok = /ok/i.test(reply);
    return {
      ok,
      message: ok ? "Connexion OK" : `Réponse inattendue : ${reply.slice(0, 80)}`,
    };
  } catch (e) {
    return { ok: false, message: (e as Error).message.slice(0, 200) };
  }
}
