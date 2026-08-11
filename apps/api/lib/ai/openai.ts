import { resolvePromptText } from "@art-therapie/shared";
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

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const DEFAULT_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_VISION_MODEL = "gpt-4o";
const TEXT_FALLBACKS = [
  "gpt-4o-mini",
  "gpt-4.1-mini",
  "gpt-5-mini",
  "gpt-5.6-luna",
] as const;
const VISION_FALLBACKS = ["gpt-4o", "gpt-4.1", "gpt-5-mini", "gpt-5.6-luna"] as const;

function openaiHttpError(status: number, rawBody: string, model?: string): Error {
  let detail = `OpenAI HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: { message?: string; code?: string; type?: string };
    };
    const msg = parsed.error?.message?.trim();
    if (msg) detail = `OpenAI HTTP ${status} — ${msg.slice(0, 220)}`;
  } catch {
    const snippet = rawBody.replace(/\s+/g, " ").trim().slice(0, 160);
    if (snippet) detail = `OpenAI HTTP ${status} — ${snippet}`;
  }
  if (model && !detail.includes(model)) {
    detail = `${detail} (model: ${model})`;
  }
  return new Error(detail);
}

function shouldTryNextModel(message: string): boolean {
  return /HTTP 404|model_not_found|does not exist|not have access|unsupported_model|unknown model/i.test(
    message
  );
}

function usesMaxCompletionTokens(model: string): boolean {
  return /^gpt-5/i.test(model) || /^o\d/i.test(model);
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

export type OpenAIProviderOptions = {
  /** Clé BYOK — jamais loguée. */
  apiKey?: string;
  textModel?: string;
  visionModel?: string;
};

/** Provider BYOK OpenAI (chat completions + vision). */
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private textModel: string;
  private visionModel: string;

  constructor(options: OpenAIProviderOptions = {}) {
    this.apiKey =
      options.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
    this.textModel =
      options.textModel ?? process.env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL;
    this.visionModel =
      options.visionModel ??
      process.env.OPENAI_VISION_MODEL ??
      DEFAULT_VISION_MODEL;
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
      console.warn("[OpenAIProvider] clé manquante — fallback");
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback" as const,
      };
    }

    try {
      const prompt = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext
      );
      const raw = await this.callText(prompt, {
        systemPrompt: resolvePromptText(
          "exercise_system",
          input.promptOverrides
        ),
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
          source: "ai",
        };
      }

      return {
        ...getFallbackExercise(input),
        source: "fallback" as const,
        fallbackNote: "OpenAI a répondu, mais le format est invalide.",
      };
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur OpenAI";
      console.warn("[OpenAI generateExercise]", note);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback" as const,
        fallbackNote: note.slice(0, 400),
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
        analysisNote: "Clé OpenAI absente.",
      };
    }

    const isWriting = input.technique === "writing";
    let writtenText = input.writtenText?.trim() ?? "";

    try {
      let visualNotes: string | undefined;

      if (input.imageBase64) {
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

      throw new Error("Réponse OpenAI non exploitable");
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur OpenAI";
      console.warn("[OpenAI analyzeArtwork]", error);
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
      const text = await this.callVision(
        imageBase64,
        buildHandwritingOcrPrompt(options?.promptOverrides)
      );
      return { text: text.trim(), source: "ai" };
    } catch (error) {
      console.warn("[OpenAI transcribeHandwriting]", error);
      return { text: "", source: "fallback" };
    }
  }

  private async callText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ): Promise<string> {
    const messages: ChatMessage[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });
    return this.chatWithFallback(
      [this.textModel, ...TEXT_FALLBACKS],
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
    return this.chatWithFallback([this.visionModel, ...VISION_FALLBACKS], messages, {
      maxTokens: 1024,
      temperature: 0.4,
    });
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
        console.warn(`[OpenAI] modèle ${model}:`, lastError.message.slice(0, 180));
        if (!shouldTryNextModel(lastError.message)) throw lastError;
      }
    }

    throw lastError ?? new Error("OpenAI: tous les modèles ont échoué");
  }

  private async chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const maxTokens = options?.maxTokens ?? 512;
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
    };
    if (usesMaxCompletionTokens(model)) {
      body.max_completion_tokens = maxTokens;
    } else {
      body.max_tokens = maxTokens;
    }

    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn(`[OpenAI chat] ${response.status}:`, rawBody.slice(0, 400));
      throw openaiHttpError(response.status, rawBody, model);
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenAI: réponse vide");
    return content;
  }
}
