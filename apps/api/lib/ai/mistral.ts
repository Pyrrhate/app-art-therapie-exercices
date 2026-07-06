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

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";

const WARM_REFLECTION_SYSTEM =
  "Tu es un·e art-thérapeute francophone. Vouvoiement, ton chaleureux et profond. Tu rédiges 3 à 4 paragraphes qui accueillent couleurs, formes, émotions et geste créatif sans jargon clinique ni catalogue froid.";

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
export class MistralProvider implements AIProvider {
  private apiKey: string;
  private textModel: string;
  private visionModel: string;

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY ?? "";
    this.textModel = process.env.MISTRAL_TEXT_MODEL ?? "mistral-small-latest";
    this.visionModel = process.env.MISTRAL_VISION_MODEL ?? "pixtral-12b-2409";
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
      };
    }

    try {
      const prompt = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext
      );
      const raw = await this.callText(prompt);
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

      return { ...getFallbackExercise(input), source: "fallback" as const };
    } catch (error) {
      console.warn("[Mistral generateExercise]", error);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback" as const,
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (input.technique && !isAiAnalysisSupported(input.technique)) {
      const fallback = getFallbackReflection(input);
      return { ...fallback, source: "fallback", analysisNote: "Technique sans analyse IA." };
    }

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
          buildVisionObservationPrompt(isWriting, input.exercise)
        );

        if (isWriting && writtenText.length < 20) {
          try {
            const ocr = await this.callVision(
              input.imageBase64,
              buildHandwritingOcrPrompt()
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
      };

      let warmRaw = await this.callText(buildWarmReflectionPrompt(promptCtx), {
        temperature: 0.82,
        maxTokens: 950,
        systemPrompt: WARM_REFLECTION_SYSTEM,
      });
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.callText(
          buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx),
          { temperature: 0.78, maxTokens: 950, systemPrompt: WARM_REFLECTION_SYSTEM }
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
    imageBase64: string
  ): Promise<{ text: string; source: "ai" | "fallback" }> {
    if (!this.apiKey) return { text: "", source: "fallback" };

    try {
      const text = await this.callVision(imageBase64, buildHandwritingOcrPrompt());
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
      throw new Error(`Mistral HTTP ${response.status}`);
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Mistral: réponse vide");
    return content;
  }
}
