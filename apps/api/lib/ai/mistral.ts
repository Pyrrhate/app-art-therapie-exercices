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

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
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

/** Provider premium — API Mistral (texte + vision Pixtral). */
export type MistralProviderOptions = {
  /** Clé fournie par le client (BYOK) — jamais loguée. */
  apiKey?: string;
  textModel?: string;
  visionModel?: string;
};

export class MistralProvider implements AIProvider {
  private apiKey: string;
  private textModel: string;
  private visionModel: string;

  constructor(options: MistralProviderOptions = {}) {
    this.apiKey =
      options.apiKey?.trim() || process.env.MISTRAL_API_KEY?.trim() || "";
    this.textModel =
      options.textModel ??
      process.env.MISTRAL_TEXT_MODEL ??
      "mistral-small-latest";
    this.visionModel =
      options.visionModel ??
      process.env.MISTRAL_VISION_MODEL ??
      "pixtral-12b-2409";
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.apiKey) {
      console.warn("[MistralProvider] MISTRAL_API_KEY manquant — fallback");
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback" as const,
        fallbackNote:
          "Aucune clé Mistral disponible. Vérifiez Réglages → Moteurs IA.",
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
          ...(parsed.development ? { development: parsed.development } : {}),
          source: "ai",
        };
      }

      return {
        ...getFallbackExercise(input),
        source: "fallback" as const,
        fallbackNote:
          "Mistral a répondu, mais le format n’était pas exploitable. Réessayez ou vérifiez vos prompts personnalisés.",
      };
    } catch (error) {
      console.warn("[Mistral generateExercise]", error);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback" as const,
        fallbackNote: explainMistralFailure(error),
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (!this.apiKey) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "MISTRAL_API_KEY non configuré.",
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

      throw new Error("Réponse Mistral non exploitable");
    } catch (error) {
      const note = error instanceof Error ? error.message : "Erreur Mistral";
      console.warn("[Mistral analyzeArtwork]", error);
      const fallback = getFallbackReflection(input);
      return { ...fallback, source: "fallback", analysisNote: note.slice(0, 400) };
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
      console.warn("[Mistral transcribeHandwriting]", error);
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
    return this.chat(messages, this.textModel, options);
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
    return this.chat(messages, this.visionModel, { maxTokens: 1024, temperature: 0.4 });
  }

  private async chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const response = await fetch(MISTRAL_CHAT_URL, {
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
      console.warn(`[Mistral chat] ${response.status}:`, rawBody.slice(0, 400));
      const detail = rawBody.slice(0, 180).replace(/\s+/g, " ").trim();
      throw new Error(`Mistral HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Mistral: réponse vide");
    return content;
  }
}

function explainMistralFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/HTTP 401|HTTP 403/i.test(message)) {
    return "Clé Mistral refusée (401/403). Recréez la clé sur console.mistral.ai, activez le plan Experiment (gratuit) ou Scale, et collez-la à nouveau dans Réglages.";
  }
  if (/HTTP 402|payment|insufficient|credit|balance/i.test(message)) {
    return "Compte Mistral sans solde / paiement requis. Ajoutez des crédits ou activez le pay-as-you-go sur console.mistral.ai (Billing).";
  }
  if (/HTTP 429/i.test(message)) {
    return "Quota Mistral dépassé (429). Attendez un instant, ou passez au plan Scale / augmentez vos limites sur console.mistral.ai.";
  }
  if (/HTTP 400/i.test(message)) {
    return "Requête refusée par Mistral (400). Vérifiez le modèle autorisé pour votre compte, ou recréez la clé API.";
  }
  if (/timeout|Timeout|AbortError/i.test(message)) {
    return "Mistral n’a pas répondu à temps. Réessayez dans un instant.";
  }
  return "Votre clé Mistral n’a pas pu générer l’exercice (clé, quota ou réponse inattendue). Vérifiez Billing et les clés sur console.mistral.ai.";
}
