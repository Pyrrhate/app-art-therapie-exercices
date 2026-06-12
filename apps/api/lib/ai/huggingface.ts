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

const HF_API = "https://api-inference.huggingface.co/models";

interface HFTextResponse {
  generated_text?: string;
  choices?: Array<{ message?: { content?: string } }>;
}

export class HuggingFaceProvider implements AIProvider {
  private token: string;
  private textModel: string;
  private visionModel: string;

  constructor() {
    this.token = process.env.HF_TOKEN ?? "";
    this.textModel =
      process.env.HF_TEXT_MODEL ?? "meta-llama/Meta-Llama-3-8B-Instruct";
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
    } catch {
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
    } catch {
      const fallback = getFallbackReflection();
      return { ...fallback, source: "fallback" };
    }
  }

  private async callTextModel(prompt: string): Promise<string> {
    const response = await fetch(`${HF_API}/${this.textModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 512, return_full_text: false },
      }),
    });

    if (!response.ok) {
      throw new Error(`HF text error: ${response.status}`);
    }

    const data = (await response.json()) as HFTextResponse | HFTextResponse[];
    const item = Array.isArray(data) ? data[0] : data;
    return item?.generated_text ?? item?.choices?.[0]?.message?.content ?? "";
  }

  private async callVisionModel(
    imageBase64: string,
    prompt: string
  ): Promise<string> {
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch(`${HF_API}/${this.visionModel}`, {
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

    if (!response.ok) {
      throw new Error(`HF vision error: ${response.status}`);
    }

    const data = (await response.json()) as HFTextResponse | HFTextResponse[];
    const item = Array.isArray(data) ? data[0] : data;
    return item?.generated_text ?? "";
  }
}
