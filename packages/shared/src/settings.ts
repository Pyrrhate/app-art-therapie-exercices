/**
 * Types réglages IA / BYOK (alignés sur le brief produit).
 * Stockage des clés : uniquement côté client (SecureStore / LocalStorage).
 */

export type {
  ByokProviderId as AIProvider,
} from "./byok-providers";

export {
  BYOK_PROVIDER_IDS,
  EUROPEAN_BYOK_PROVIDERS,
  CANADIAN_BYOK_PROVIDERS,
  GLOBAL_BYOK_PROVIDERS,
  CREATIVE_COACH_SAFETY,
  isByokProviderId,
} from "./byok-providers";

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  mistral?: string;
  gemini?: string;
  scaleway?: string;
  ovhcloud?: string;
  alephalpha?: string;
  cohere?: string;
  /** Ex. "http://localhost:11434" — stocké localement comme « clé » Ollama. */
  ollamaBaseUrl?: string;
}

export interface PromptConfig {
  systemPrompt: string;
  temperature: number;
}
