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
  buildReflectionPrompt,
  parseExerciseFromAi,
  parseReflectionFromAi,
} from "./prompts";

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_INFERENCE_URL = "https://router.huggingface.co/hf-inference/models";
const VISION_FETCH_TIMEOUT_MS = 90_000;

/** Modèles vision testés sur le router HF (chat completions multimodal). */
const DEFAULT_VISION_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct:fastest";
const VISION_MODEL_FALLBACKS = [
  "Qwen/Qwen2.5-VL-7B-Instruct:fastest",
  "Qwen/Qwen2.5-VL-7B-Instruct",
  "llava-hf/llava-1.5-7b-hf",
];

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: string;
}

interface HFInferenceResponse {
  generated_text?: string;
}

function toDataImageUrl(imageBase64: string): string {
  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }
  return `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, "")}`;
}

function stripDataUrl(imageBase64: string): string {
  return imageBase64.replace(/^data:image\/\w+;base64,/, "");
}

function logHfError(context: string, status: number, body: string): void {
  console.warn(`[HF ${context}] ${status}: ${body.slice(0, 400)}`);
}

function visionModelCandidates(configured?: string): string[] {
  const models = [
    configured?.trim(),
    process.env.HF_VISION_MODEL?.trim(),
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
    if (!this.token) {
      return getFallbackExercise(input);
    }

    try {
      const prompt = buildExercisePrompt(input.impulse, input.technique);
      const raw = await this.callTextModel(prompt);
      const parsed = parseExerciseFromAi(raw);

      if (parsed) {
        return {
          exercise: parsed.exercise,
          durationMinutes: parsed.durationMinutes,
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
      return getFallbackExercise(input);
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (!this.token) {
      console.warn("[HF analyzeArtwork] HF_TOKEN manquant");
      const fallback = getFallbackReflection();
      return { ...fallback, source: "fallback" };
    }

    try {
      const prompt = buildReflectionPrompt(input.impulse, input.technique);
      const raw = await this.callVisionModel(input.imageBase64, prompt);
      const parsed = parseReflectionFromAi(raw);

      if (parsed) {
        return {
          reflection: parsed.reflection,
          openQuestions: parsed.openQuestions,
          source: "ai",
        };
      }

      console.warn(
        "[HF analyzeArtwork] réponse non exploitable:",
        raw.slice(0, 300)
      );
      throw new Error("HF vision: réponse non exploitable");
    } catch (error) {
      console.warn("[HF analyzeArtwork]", error);
      const fallback = getFallbackReflection();
      return { ...fallback, source: "fallback" };
    }
  }

  private async callTextModel(prompt: string): Promise<string> {
    const response = await fetch(HF_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.textModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const rawBody = await response.text();

    if (!response.ok) {
      logHfError("chat", response.status, rawBody);
      throw new Error(`HF chat error: ${response.status}`);
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

    try {
      const legacyModel =
        this.visionModels.find((m) => m.includes("llava")) ??
        "llava-hf/llava-1.5-7b-hf";
      return await this.callVisionInference(imageBase64, prompt, legacyModel);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`inference: ${msg}`);
    }

    throw new Error(`HF vision: tous les modèles ont échoué — ${errors.join(" | ")}`);
  }

  private async callVisionChat(
    imageBase64: string,
    prompt: string,
    model: string
  ): Promise<string> {
    const imageUrl = toDataImageUrl(imageBase64);

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
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "low" },
              },
            ],
          },
        ],
        max_tokens: 512,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(VISION_FETCH_TIMEOUT_MS),
    });

    const rawBody = await response.text();

    if (!response.ok) {
      logHfError(`vision-chat:${model}`, response.status, rawBody);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = JSON.parse(rawBody) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("réponse vide");
    }

    return content;
  }

  private async callVisionInference(
    imageBase64: string,
    prompt: string,
    model: string
  ): Promise<string> {
    const imageData = stripDataUrl(imageBase64);

    const response = await fetch(`${HF_INFERENCE_URL}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image: imageData,
          text: prompt,
        },
        parameters: { max_new_tokens: 512 },
      }),
      signal: AbortSignal.timeout(VISION_FETCH_TIMEOUT_MS),
    });

    const rawBody = await response.text();

    if (!response.ok) {
      logHfError(`vision-inference:${model}`, response.status, rawBody);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = JSON.parse(rawBody) as
      | HFInferenceResponse
      | HFInferenceResponse[];

    const item = Array.isArray(data) ? data[0] : data;
    const text = item?.generated_text?.trim();

    if (!text) {
      throw new Error("réponse vide");
    }

    return text;
  }
}
