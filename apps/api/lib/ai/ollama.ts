/**
 * Ollama local — BYOK via URL de base (ex. http://127.0.0.1:11434).
 * Le champ « clé » côté client contient l’URL ; jamais persistée serveur.
 *
 * Stratégie de robustesse :
 * - normalise l’URL (trailing slash, /v1, /api)
 * - préfère /v1/chat/completions (OpenAI-compat), puis /api/chat
 * - si le modèle demandé manque, lit /api/tags et prend le premier modèle local
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
  type ReflectionPromptContext,
} from "./prompts";

const DEFAULT_MODEL_CANDIDATES = [
  "llama3.2",
  "llama3.1",
  "llama3",
  "mistral",
  "qwen2.5",
  "gemma2",
  "phi3",
  "llama2",
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

/** Nettoie une URL collée depuis la doc (avec ou sans /v1, /api). */
export function normalizeOllamaBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (!url) return "";
  // Accepte host:port sans schéma (ex. 192.168.1.10:11434)
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/v1$/i, "");
  url = url.replace(/\/api$/i, "");
  return url.replace(/\/+$/, "");
}

function isModelMissingError(message: string): boolean {
  return /HTTP 404|model.*not found|not found.*model|pull model|unknown model|does not exist|no such model/i.test(
    message
  );
}

function explainOllamaFailure(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|network|timeout|AbortError|failed to fetch/i.test(msg)) {
    return `${msg} — Ollama doit être joignable depuis le serveur API (pas seulement localhost du téléphone). Utilisez une IP LAN, un tunnel (ngrok/cloudflared) ou une URL publique.`;
  }
  return msg;
}

export type OllamaProviderOptions = {
  /** Base URL Ollama, ex. http://127.0.0.1:11434 */
  baseUrl: string;
  model?: string;
};

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private preferredModel: string;
  private resolvedModel: string | null = null;

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = normalizeOllamaBaseUrl(options.baseUrl);
    this.preferredModel =
      options.model?.trim() ||
      process.env.OLLAMA_MODEL?.trim() ||
      DEFAULT_MODEL_CANDIDATES[0];
  }

  async ping(): Promise<string> {
    if (!this.baseUrl) throw new Error("URL Ollama manquante.");
    const tags = await this.listLocalModels();
    if (tags.length === 0) {
      throw new Error(
        "Ollama répond mais aucun modèle n’est installé. Exécutez par ex. `ollama pull llama3.2`."
      );
    }
    // Ping léger via generate court sur un modèle présent
    const model = await this.resolveModel();
    const reply = await this.chat(
      "Répondez strictement: OK",
      "Répondez uniquement par le mot OK.",
      { model, maxTokens: 16, temperature: 0 }
    );
    return reply;
  }

  async generateExercise(input: ExerciseRequest): Promise<ExerciseResponse> {
    const preferredDuration = input.durationMinutes;
    if (!this.baseUrl) {
      const fallback = getFallbackExercise(input);
      return {
        ...fallback,
        durationMinutes: preferredDuration ?? fallback.durationMinutes,
        source: "fallback",
        fallbackNote: "URL Ollama manquante.",
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
      const raw = await this.chat(
        resolveExerciseSystemPrompt(input.promptOverrides, language),
        prompt,
        { jsonBias: true }
      );
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
        fallbackNote: "Ollama: format non exploitable.",
      };
    } catch (error) {
      const note = explainOllamaFailure(error);
      console.warn("[Ollama generateExercise]", note);
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
    if (!this.baseUrl) {
      return {
        ...getFallbackCreativeTips(input),
        fallbackNote: "URL Ollama manquante.",
      };
    }
    try {
      return await runCreativeTipsGeneration(input, (user, system) =>
        this.chat(system, user, {
          maxTokens: 600,
          temperature: 0.8,
          jsonBias: true,
        })
      );
    } catch (error) {
      const note = explainOllamaFailure(error);
      console.warn("[Ollama generateCreativeTips]", note);
      return {
        ...getFallbackCreativeTips(input),
        fallbackNote: note.slice(0, 400),
      };
    }
  }

  async analyzeArtwork(input: ReflectionRequest): Promise<ReflectionResponse> {
    if (!this.baseUrl) {
      const fallback = getFallbackReflection(input);
      return {
        ...fallback,
        source: "fallback",
        analysisNote: "URL Ollama manquante.",
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
          ? "(Image fournie — Ollama texte : appuyez-vous sur le ressenti décrit.)"
          : undefined,
      };

      const system = resolvePromptText(
        "reflection_system",
        input.promptOverrides
      );
      let warmRaw = await this.chat(
        system,
        buildWarmReflectionPrompt(promptCtx),
        { jsonBias: true }
      );
      let parsed = parseReflectionFromAi(warmRaw);

      const needsRetry =
        parsed?.reflection &&
        (looksLikeColdDescription(parsed.reflection) ||
          looksLikeTooBriefReflection(parsed.reflection));

      if (needsRetry && parsed?.reflection) {
        warmRaw = await this.chat(
          system,
          buildWarmReflectionRetryPrompt(parsed.reflection, promptCtx),
          { jsonBias: true }
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
      throw new Error("Réponse Ollama non exploitable");
    } catch (error) {
      const note = explainOllamaFailure(error);
      console.warn("[Ollama analyzeArtwork]", note);
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

  private async resolveModel(): Promise<string> {
    if (this.resolvedModel) return this.resolvedModel;

    let installed: string[] = [];
    try {
      installed = await this.listLocalModels();
    } catch {
      /* /api/tags peut échouer ; on tente quand même les candidats */
    }

    const candidates = [
      this.preferredModel,
      ...DEFAULT_MODEL_CANDIDATES,
      ...installed,
    ];

    // Match exact ou préfixe (llama3.2 ↔ llama3.2:latest)
    for (const candidate of candidates) {
      if (!candidate) continue;
      const hit = installed.find(
        (name) =>
          name === candidate ||
          name.startsWith(`${candidate}:`) ||
          candidate.startsWith(`${name}:`)
      );
      if (hit) {
        this.resolvedModel = hit;
        return hit;
      }
    }

    if (installed[0]) {
      this.resolvedModel = installed[0];
      return installed[0];
    }

    this.resolvedModel = this.preferredModel;
    return this.preferredModel;
  }

  private async listLocalModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Ollama /api/tags HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
      models?: Array<{ name?: string; model?: string }>;
    };
    return (data.models ?? [])
      .map((m) => (m.name || m.model || "").trim())
      .filter(Boolean);
  }

  private async chat(
    system: string,
    user: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      jsonBias?: boolean;
    }
  ): Promise<string> {
    const model = options?.model ?? (await this.resolveModel());
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 900;

    try {
      return await this.chatOpenAiCompat(model, system, user, {
        temperature,
        maxTokens,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isModelMissingError(msg)) {
        this.resolvedModel = null;
        const retryModel = await this.resolveModel();
        if (retryModel !== model) {
          try {
            return await this.chatOpenAiCompat(retryModel, system, user, {
              temperature,
              maxTokens,
            });
          } catch {
            /* native below */
          }
        }
      }
      // Fallback native Ollama
    }

    return this.chatNative(model, system, user, {
      temperature,
      jsonBias: options?.jsonBias,
    });
  }

  private async chatOpenAiCompat(
    model: string,
    system: string,
    user: string,
    options: { temperature: number; maxTokens: number }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `${CREATIVE_COACH_SAFETY}\n\n${system}`,
          },
          { role: "user", content: user },
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status} — ${raw.slice(0, 160)}`);
    }
    const data = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Ollama: réponse vide");
    return text;
  }

  private async chatNative(
    model: string,
    system: string,
    user: string,
    options: { temperature: number; jsonBias?: boolean }
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model,
      stream: false,
      options: { temperature: options.temperature },
      messages: [
        {
          role: "system",
          content: `${CREATIVE_COACH_SAFETY}\n\n${system}`,
        },
        { role: "user", content: user },
      ],
    };
    if (options.jsonBias) {
      body.format = "json";
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      // Si format=json non supporté, retente sans
      if (options.jsonBias && /format|json/i.test(raw)) {
        return this.chatNative(model, system, user, {
          temperature: options.temperature,
          jsonBias: false,
        });
      }
      throw new Error(`Ollama HTTP ${response.status} — ${raw.slice(0, 160)}`);
    }
    const data = JSON.parse(raw) as {
      message?: { content?: string };
      response?: string;
      error?: string;
    };
    if (data.error) {
      if (isModelMissingError(data.error)) {
        this.resolvedModel = null;
        const retryModel = await this.resolveModel();
        if (retryModel !== model) {
          return this.chatNative(retryModel, system, user, options);
        }
      }
      throw new Error(`Ollama — ${data.error}`);
    }
    const text = (data.message?.content ?? data.response ?? "").trim();
    if (!text) throw new Error("Ollama: réponse vide");
    return text;
  }
}
