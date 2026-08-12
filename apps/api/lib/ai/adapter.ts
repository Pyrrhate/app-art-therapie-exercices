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

/** Endpoints européens OpenAI-compatible. */
export const PROVIDER_ENDPOINTS = {
  scaleway: {
    baseUrl: "https://api.scaleway.ai/v1",
    textModel: "llama-3.3-70b-instruct",
    visionModel: "llama-3.3-70b-instruct",
    fallbackModels: [
      "mistral-small-3.2-24b-instruct-2506",
      "gemma-4-26b-a4b-it",
      "mistral-medium-3.5-128b",
    ],
    textOnly: true as const,
  },
  ovhcloud: {
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    textModel: "Meta-Llama-3_3-70B-Instruct",
    visionModel: "Meta-Llama-3_3-70B-Instruct",
    fallbackModels: [
      "Meta-Llama-3_1-70B-Instruct",
      "Mixtral-8x22B-Instruct-v0.1",
    ],
    textOnly: true as const,
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
        baseUrl: cfg.baseUrl,
        apiKey,
        textModel: cfg.textModel,
        visionModel: cfg.visionModel,
        fallbackModels: [...cfg.fallbackModels],
        textOnly: cfg.textOnly,
      });
    }
    case "ovhcloud": {
      const cfg = PROVIDER_ENDPOINTS.ovhcloud;
      return new OpenAICompatibleProvider({
        label: "OVHcloud",
        baseUrl: cfg.baseUrl,
        apiKey,
        textModel: cfg.textModel,
        visionModel: cfg.visionModel,
        fallbackModels: [...cfg.fallbackModels],
        textOnly: cfg.textOnly,
      });
    }
    case "mistral":
    default:
      return new MistralProvider({ apiKey });
  }
}

export type { ByokProviderId };
