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

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const VISION_FETCH_TIMEOUT_MS = 90_000;
/** Limite prudente pour data URL dans le corps JSON chat (évite 400/413 côté routeur). */
const VISION_MAX_DATA_URL_CHARS = 520_000;

/**
 * Modèles recommandés (Vercel → variables d'environnement) :
 *
 * HF_TEXT_MODEL — génération d'exercices (chat, JSON)
 *   Ex. meta-llama/Llama-3.1-8B-Instruct
 *
 * HF_VISION_MODEL — analyse photo (chat multimodal via Inference Providers)
 *   Recommandé : zai-org/GLM-4.5V:novita
 *   Alternative : CohereLabs/aya-vision-32b:cohere
 *   Éviter : Qwen/Qwen2.5-VL-7B-Instruct:fastest, llava-hf/* (sans provider live sur le routeur HF)
 *
 * HF_TOKEN — obligatoire en prod ; sans token → mode secours côté API.
 */
const DEFAULT_VISION_MODEL = "zai-org/GLM-4.5V:novita";
const VISION_MODEL_FALLBACKS = [
  "zai-org/GLM-4.5V:novita",
  "zai-org/GLM-4.5V:zai-org",
  "zai-org/GLM-4.5V",
  "CohereLabs/aya-vision-32b:cohere",
];

const WARM_REFLECTION_SYSTEM =
  "Tu es un·e art-thérapeute francophone. Vouvoiement, ton chaleureux et profond. Tu rédiges 3 à 4 paragraphes qui accueillent couleurs, formes, émotions et geste créatif sans jargon clinique ni catalogue froid.";

/** Modèles Hub sans provider Inference live — le routeur renvoie HTTP 400. */
const DEPRECATED_VISION_MODEL_RE =
  /(?:Qwen\/Qwen2(?:\.5)?-VL|llava-hf\/llava|meta-llama\/Llama-3\.2-11B-Vision)/i;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: string;
}

function toDataImageUrl(imageBase64: string): string {
  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }
  return `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, "")}`;
}

function logHfError(context: string, status: number, body: string): void {
  console.warn(`[HF ${context}] ${status}: ${body.slice(0, 600)}`);
}

function extractHfErrorMessage(rawBody: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed) return "";

  try {
    const data = JSON.parse(trimmed) as {
      error?: string | { message?: string; code?: string };
      message?: string;
    };
    const err = data.error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      return err.message ?? err.code ?? JSON.stringify(err);
    }
    if (typeof data.message === "string") return data.message;
  } catch {
    /* corps non JSON */
  }

  return trimmed.replace(/\s+/g, " ");
}

function formatHfHttpError(status: number, rawBody: string, maxLen = 280): string {
  const detail = extractHfErrorMessage(rawBody).slice(0, maxLen);
  return detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`;
}

function expandVisionModel(model: string): string[] {
  const trimmed = model.trim();
  if (!trimmed) return [];

  const withoutPolicy = trimmed.replace(/:(fastest|cheapest|preferred)$/, "");
  if (DEPRECATED_VISION_MODEL_RE.test(withoutPolicy)) {
    console.warn(
      `[HF vision] modèle non routable ignoré (${trimmed}) — utilisez zai-org/GLM-4.5V:novita`
    );
    return [];
  }

  const variants = new Set<string>();

  if (/:(fastest|cheapest|preferred)$/.test(trimmed)) {
    return [];
  }

  variants.add(trimmed);

  if (!trimmed.includes(":")) {
    if (withoutPolicy.startsWith("zai-org/GLM-4.5V")) {
      variants.add(`${withoutPolicy}:novita`);
      variants.add(`${withoutPolicy}:zai-org`);
    } else if (withoutPolicy.startsWith("CohereLabs/aya-vision")) {
      variants.add(`${withoutPolicy}:cohere`);
    }
  }

  return [...variants];
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

function visionModelCandidates(configured?: string): string[] {
  const configuredModels = [
    configured?.trim(),
    process.env.HF_VISION_MODEL?.trim(),
  ]
    .filter((m): m is string => Boolean(m))
    .flatMap(expandVisionModel);

  const models = [
    ...configuredModels,
    DEFAULT_VISION_MODEL,
    ...VISION_MODEL_FALLBACKS,
  ].filter((m): m is string => Boolean(m));

  return [...new Set(models)];
}

export class HuggingFaceProvider implements AIProvider {
  private token: string;
  private textModel: string;
  private visionModels: string[];

  constructor() {
    this.token = process.env.HF_TOKEN ?? "";
    this.textModel =
      process.env.HF_TEXT_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct";
    this.visionModels = visionModelCandidates(process.env.HF_VISION_MODEL);
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.token) {
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
      };
    }

    try {
      const prompt = buildExercisePrompt(
        input.impulse,
        input.technique,
        preferredDuration ?? 15,
        input.augmentationContext
      );
      const raw = await this.callTextModel(prompt);
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

      console.warn(
        "[HF generateExercise] réponse non exploitable:",
        raw.slice(0, 200)
      );
      return getFallbackExercise(input);
    } catch (error) {
      console.warn("[HF generateExercise]", error);
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
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

    if (!this.token) {
      console.warn("[HF analyzeArtwork] HF_TOKEN manquant");
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "HF_TOKEN non configuré sur le serveur.",
      };
    }

    const isWriting = input.technique === "writing";
    let writtenText = input.writtenText?.trim() ?? "";

    try {
      let visualNotes: string | undefined;

      if (input.imageBase64) {
        visualNotes = await this.callVisionModel(
          input.imageBase64,
          buildVisionObservationPrompt(isWriting, input.exercise)
        );

        if (isWriting && writtenText.length < 20) {
          try {
            const ocr = await this.callVisionModel(
              input.imageBase64,
              buildHandwritingOcrPrompt()
            );
            const transcribed = ocr.trim();
            if (transcribed.length > 5) {
              writtenText = transcribed;
            }
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

      let warmRaw = await this.callTextModel(
        buildWarmReflectionPrompt(promptCtx),
        { temperature: 0.82, maxTokens: 950, systemPrompt: WARM_REFLECTION_SYSTEM }
      );
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        console.warn("[HF analyzeArtwork] reformulation (ton ou longueur)");
        warmRaw = await this.callTextModel(
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

      if (parsed?.reflection && looksLikeColdDescription(parsed.reflection)) {
        throw new Error("Réponse trop descriptive après reformulation");
      }

      console.warn(
        "[HF analyzeArtwork] réponse non exploitable:",
        warmRaw.slice(0, 300)
      );
      throw new Error("Réponse IA illisible — reformulation impossible");
    } catch (error) {
      const note =
        error instanceof Error ? error.message : "Erreur vision inconnue";
      console.warn("[HF analyzeArtwork]", error);
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: note.slice(0, 400),
      };
    }
  }

  async transcribeHandwriting(
    imageBase64: string
  ): Promise<{ text: string; source: "ai" | "fallback" }> {
    if (!this.token) {
      return { text: "", source: "fallback" };
    }

    try {
      const text = await this.callVisionModel(
        imageBase64,
        buildHandwritingOcrPrompt()
      );
      return { text: text.trim(), source: "ai" };
    } catch (error) {
      console.warn("[HF transcribeHandwriting]", error);
      return { text: "", source: "fallback" };
    }
  }

  private async callTextModel(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(HF_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.textModel,
        messages,
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.7,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const rawBody = await response.text();

    if (!response.ok) {
      logHfError("chat", response.status, rawBody);
      throw new Error(formatHfHttpError(response.status, rawBody));
    }

    const data = JSON.parse(rawBody) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("HF chat: réponse vide");
    }

    return content;
  }

  private async callVisionModel(
    imageBase64: string,
    prompt: string
  ): Promise<string> {
    const errors: string[] = [];

    for (const model of this.visionModels) {
      try {
        const result = await this.callVisionChat(imageBase64, prompt, model);
        console.info(`[HF vision] succès avec ${model}`);
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`${model}: ${msg}`);
        console.warn(`[HF vision] échec ${model}:`, msg);
      }
    }

    throw new Error(`HF vision: tous les modèles ont échoué — ${errors.join(" | ")}`);
  }

  private async callVisionChat(
    imageBase64: string,
    prompt: string,
    model: string
  ): Promise<string> {
    const imageUrl = toDataImageUrl(imageBase64);
    if (imageUrl.length > VISION_MAX_DATA_URL_CHARS) {
      throw new Error(
        `image trop volumineuse pour l'API chat (${Math.round(imageUrl.length / 1024)} Ko data URL)`
      );
    }

    const response = await fetch(HF_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 768,
        temperature: 0.72,
      }),
      signal: AbortSignal.timeout(VISION_FETCH_TIMEOUT_MS),
    });

    const rawBody = await response.text();

    if (!response.ok) {
      logHfError(`vision-chat:${model}`, response.status, rawBody);
      throw new Error(formatHfHttpError(response.status, rawBody));
    }

    const data = JSON.parse(rawBody) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("réponse vide");
    }

    return content;
  }
}
