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
  parseJsonFromText,
} from "./prompts";

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_INFERENCE_URL = "https://router.huggingface.co/hf-inference/models";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: string;
}

interface HFInferenceResponse {
  generated_text?: string;
}

function logHfError(context: string, status: number, body: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[HF ${context}] ${status}: ${body.slice(0, 300)}`);
}

export class HuggingFaceProvider implements AIProvider {
  private token: string;
  private textModel: string;
  private visionModel: string;

  constructor() {
    this.token = process.env.HF_TOKEN ?? "";
    this.textModel =
      process.env.HF_TEXT_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct";
    this.visionModel =
      process.env.HF_VISION_MODEL ?? "llava-hf/llava-1.5-7b-hf";
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    if (!this.token) {
      return getFallbackExercise(input);
    }

    try {
      const prompt = buildExercisePrompt(input.impulse, input.technique);
      const raw = await this.callTextModel(prompt);
      const parsed = parseJsonFromText<{
        exercise: string;
        durationMinutes: number;
      }>(raw);

      if (parsed?.exercise) {
        return {
          exercise: parsed.exercise,
          durationMinutes: parsed.durationMinutes ?? 15,
          source: "ai",
        };
      }

      return {
        exercise: raw.trim() || getFallbackExercise(input).exercise,
        durationMinutes: 15,
        source: "ai",
      };
    } catch (error) {
      console.warn("[HF generateExercise]", error);
      return getFallbackExercise(input);
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (!this.token) {
      const fallback = getFallbackReflection();
      return { ...fallback, source: "fallback" };
    }

    try {
      const prompt = buildReflectionPrompt(input.impulse, input.technique);
      const raw = await this.callVisionModel(input.imageBase64, prompt);
      const parsed = parseJsonFromText<{
        reflection: string;
        openQuestions: string[];
      }>(raw);

      if (parsed?.reflection) {
        return {
          reflection: parsed.reflection,
          openQuestions: parsed.openQuestions ?? [],
          source: "ai",
        };
      }

      const fallback = getFallbackReflection();
      return {
        reflection: raw.trim() || fallback.reflection,
        openQuestions: fallback.openQuestions,
        source: "ai",
      };
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
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch(`${HF_INFERENCE_URL}/${this.visionModel}`, {
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
    });

    const rawBody = await response.text();

    if (!response.ok) {
      logHfError("vision", response.status, rawBody);
      throw new Error(`HF vision error: ${response.status}`);
    }

    const data = JSON.parse(rawBody) as
      | HFInferenceResponse
      | HFInferenceResponse[];

    const item = Array.isArray(data) ? data[0] : data;
    const text = item?.generated_text?.trim();

    if (!text) {
      throw new Error("HF vision: réponse vide");
    }

    return text;
  }
}
