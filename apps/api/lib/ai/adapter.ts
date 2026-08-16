/**
 * Adaptateur unifié BYOK — route vers le provider choisi.
 * Stateless : aucune persistance de clé ni de prompt.
 */

import type { ByokProviderId } from "@art-therapie/shared";
import type { AIProvider } from "../types";
import { AnthropicProvider } from "./anthropic";
import { AlephAlphaProvider } from "./aleph-alpha";
import { GeminiProvider } from "./gemini";
import { MistralProvider } from "./mistral";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import { OpenAICompatibleProvider } from "./openai-compatible";

export interface AdapterCredentials {
  provider: ByokProviderId;
  apiKey: string;
}

/**
 * Endpoints européens OpenAI-compatible.
 * Modèles alignés sur les catalogues publics (août 2026) + alias historiques
 * pour maximiser les chances sans test manuel.
 */
export const PROVIDER_ENDPOINTS = {
  scaleway: {
    baseUrl: "https://api.scaleway.ai/v1",
    // Serverless « Yes » : docs Scaleway supported-models
    textModel: "llama-3.3-70b-instruct",
    visionModel: "mistral-small-3.2-24b-instruct-2506",
    fallbackModels: [
      "mistral-small-3.2-24b-instruct-2506",
      "gemma-4-26b-a4b-it",
      "mistral-medium-3.5-128b",
      "qwen3.6-35b-a3b",
      "gemma-3-27b-it",
    ],
    visionFallbackModels: [
      "gemma-4-26b-a4b-it",
      "mistral-medium-3.5-128b",
      "gemma-3-27b-it",
    ],
    textOnly: false as const,
  },
  ovhcloud: {
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    // Catalog API id + alias docs + anciens IDs playground
    textModel: "llama-3-3-70b-instruct",
    visionModel: "qwen-2-5-vl-72b-instruct",
    fallbackModels: [
      "Meta-Llama-3_3-70B-Instruct",
      "meta-llama-3_3-70b-instruct",
      "gpt-oss-20b",
      "gpt-oss-120b",
      "qwen-3-5-9b",
      "qwen-3-6-27b",
    ],
    visionFallbackModels: [
      "qwen-3-5-9b",
      "qwen-3-6-27b",
      "qwen-3-5-397b",
    ],
    textOnly: false as const,
  },
} as const;

/**
 * Instancie un client éphémère (mémoire requête uniquement).
 * Pour Ollama, `apiKey` contient l’URL de base.
 */
export function createAiAdapter(credentials: AdapterCredentials): AIProvider {
  const { provider, apiKey } = credentials;

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider({ apiKey });
    case "openai":
      return new OpenAIProvider({ apiKey });
    case "gemini":
      return new GeminiProvider({ apiKey });
    case "alephalpha":
      return new AlephAlphaProvider({ apiKey });
    case "ollama":
      return new OllamaProvider({ baseUrl: apiKey });
    case "scaleway": {
      const cfg = PROVIDER_ENDPOINTS.scaleway;
      return new OpenAICompatibleProvider({
        label: "Scaleway",
        baseUrl: process.env.SCALEWAY_BASE_URL?.trim() || cfg.baseUrl,
        apiKey,
        textModel: process.env.SCALEWAY_TEXT_MODEL?.trim() || cfg.textModel,
        visionModel:
          process.env.SCALEWAY_VISION_MODEL?.trim() || cfg.visionModel,
        fallbackModels: [...cfg.fallbackModels],
        visionFallbackModels: [...cfg.visionFallbackModels],
        textOnly: cfg.textOnly,
      });
    }
    case "ovhcloud": {
      const cfg = PROVIDER_ENDPOINTS.ovhcloud;
      return new OpenAICompatibleProvider({
        label: "OVHcloud",
        baseUrl: process.env.OVHCLOUD_BASE_URL?.trim() || cfg.baseUrl,
        apiKey,
        textModel: process.env.OVHCLOUD_TEXT_MODEL?.trim() || cfg.textModel,
        visionModel:
          process.env.OVHCLOUD_VISION_MODEL?.trim() || cfg.visionModel,
        fallbackModels: [...cfg.fallbackModels],
        visionFallbackModels: [...cfg.visionFallbackModels],
        textOnly: cfg.textOnly,
      });
    }
    case "mistral":
    default:
      return new MistralProvider({ apiKey });
  }
}

export type { ByokProviderId };
