import { resolvePromptText } from "@art-therapie/shared";
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

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** Alias stables Anthropic (3.5 retiré → 404). */
const DEFAULT_TEXT_MODEL = "claude-haiku-4-5";
const DEFAULT_VISION_MODEL = "claude-sonnet-5";
const TEXT_FALLBACKS = ["claude-haiku-4-5", "claude-sonnet-5"] as const;
const VISION_FALLBACKS = ["claude-sonnet-5", "claude-haiku-4-5"] as const;

function anthropicHttpError(status: number, rawBody: string, model?: string): Error {
  let detail = `Anthropic HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: { type?: string; message?: string };
    };
    const msg = parsed.error?.message?.trim();
    if (msg) detail = `Anthropic HTTP ${status} — ${msg.slice(0, 220)}`;
  } catch {
    const snippet = rawBody.replace(/\s+/g, " ").trim().slice(0, 160);
    if (snippet) detail = `Anthropic HTTP ${status} — ${snippet}`;
  }
  if (model && !detail.includes(model)) {
    detail = `${detail} (model: ${model})`;
  }
  return new Error(detail);
}

function shouldTryNextModel(message: string): boolean {
  return /HTTP 404|not_found|model:|no longer|deprecated|unknown model/i.test(
    message
  );
}

function stripDataUrl(imageBase64: string): {
  mediaType: string;
  data: string;
} {
  const match = imageBase64.match(/^data:(image\/[\w+.-]+);base64,(.+)$/i);
  if (match) {
    return { mediaType: match[1]!, data: match[2]! };
  }
  return {
    mediaType: "image/jpeg",
    data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
  };
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

export type AnthropicProviderOptions = {
  /** Clé BYOK — jamais loguée. */
  apiKey?: string;
  textModel?: string;
  visionModel?: string;
};

/** Provider BYOK Anthropic (Messages API — texte + vision). */
export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private textModel: string;
  private visionModel: string;

  constructor(options: AnthropicProviderOptions = {}) {
    this.apiKey =
      options.apiKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || "";
    this.textModel =
      options.textModel ??
      process.env.ANTHROPIC_TEXT_MODEL ??
      DEFAULT_TEXT_MODEL;
    this.visionModel =
      options.visionModel ??
      process.env.ANTHROPIC_VISION_MODEL ??
      DEFAULT_VISION_MODEL;
  }

  async ping(): Promise<string> {
    return this.callText("Répondez uniquement par le mot OK.", {
      maxTokens: 16,
      temperature: 0,
      system: "Répondez strictement: OK",
    });
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.apiKey) {
      console.warn("[AnthropicProvider] clé manquante — fallback");
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
        system: resolvePromptText("exercise_system", input.promptOverrides),
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
        source: "fallback" as const,
        fallbackNote: "Anthropic a répondu, mais le format est invalide.",
      };
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur Anthropic";
      console.warn("[Anthropic generateExercise]", note);
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
    if (!this.apiKey) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "Clé Anthropic absente.",
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
        previousReflection: input.previousReflection,
      };

      let warmRaw = await this.callText(buildWarmReflectionPrompt(promptCtx), {
        temperature: 0.82,
        maxTokens: 950,
        system: resolvePromptText("reflection_system", input.promptOverrides),
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
            system: resolvePromptText(
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

      throw new Error("Réponse Anthropic non exploitable");
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur Anthropic";
      console.warn("[Anthropic analyzeArtwork]", error);
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
      console.warn("[Anthropic transcribeHandwriting]", error);
      return { text: "", source: "fallback" };
    }
  }

  private async callText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; system?: string }
  ): Promise<string> {
    return this.messagesWithFallback(
      [this.textModel, ...TEXT_FALLBACKS],
      {
        system: options?.system,
        maxTokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.7,
        content: [{ type: "text", text: prompt }],
      }
    );
  }

  private async callVision(imageBase64: string, prompt: string): Promise<string> {
    const { mediaType, data } = stripDataUrl(imageBase64);
    return this.messagesWithFallback(
      [this.visionModel, ...VISION_FALLBACKS],
      {
        maxTokens: 1024,
        temperature: 0.4,
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data },
          },
          { type: "text", text: prompt },
        ],
      }
    );
  }

  private async messagesWithFallback(
    models: string[],
    params: {
      system?: string;
      maxTokens: number;
      temperature: number;
      content: Array<Record<string, unknown>>;
    }
  ): Promise<string> {
    const ordered = [...new Set(models.filter(Boolean))];
    let lastError: Error | null = null;

    for (const model of ordered) {
      try {
        return await this.messages({ ...params, model });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Anthropic] modèle ${model}:`, lastError.message.slice(0, 180));
        if (!shouldTryNextModel(lastError.message)) throw lastError;
      }
    }

    throw lastError ?? new Error("Anthropic: tous les modèles ont échoué");
  }

  private async messages(params: {
    model: string;
    system?: string;
    maxTokens: number;
    temperature: number;
    content: Array<Record<string, unknown>>;
  }): Promise<string> {
    const body: Record<string, unknown> = {
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      messages: [{ role: "user", content: params.content }],
    };
    if (params.system) body.system = params.system;

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn(
        `[Anthropic messages] ${response.status}:`,
        rawBody.slice(0, 400)
      );
      throw anthropicHttpError(response.status, rawBody, params.model);
    }

    const data = JSON.parse(rawBody) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = data.content
      ?.filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) throw new Error("Anthropic: réponse vide");
    return text;
  }
}
