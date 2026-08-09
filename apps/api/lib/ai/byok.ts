/**
 * Extraction BYOK depuis les headers HTTP.
 * La clé n'est jamais loguée ni persistée — usage mémoire uniquement.
 */
import type { AIProvider } from "../types";
import { AnthropicProvider } from "./anthropic";
import { MistralProvider } from "./mistral";
import { OpenAIProvider } from "./openai";

export const BYOK_PROVIDER_HEADER = "x-custom-ai-provider";
export const BYOK_KEY_HEADER = "x-custom-ai-key";

export type ByokProviderId = "mistral" | "anthropic" | "openai";

export interface ByokCredentials {
  provider: ByokProviderId;
  apiKey: string;
}

const VALID_PROVIDERS = new Set<ByokProviderId>([
  "mistral",
  "anthropic",
  "openai",
]);

function headerValue(request: Request, name: string): string | null {
  return request.headers.get(name)?.trim() || null;
}

/**
 * Lit les headers BYOK. Retourne null si absents ou invalides.
 * Ne logue jamais la clé.
 */
export function extractByokCredentials(
  request: Request
): ByokCredentials | null {
  const providerRaw = headerValue(request, BYOK_PROVIDER_HEADER)?.toLowerCase();
  const apiKey = headerValue(request, BYOK_KEY_HEADER);

  if (!providerRaw && !apiKey) return null;

  if (!providerRaw || !apiKey) {
    console.warn("[byok] headers incomplets (provider ou clé manquant)");
    return null;
  }

  if (!VALID_PROVIDERS.has(providerRaw as ByokProviderId)) {
    console.warn("[byok] provider inconnu:", providerRaw);
    return null;
  }

  if (apiKey.length < 8) {
    console.warn("[byok] clé trop courte — ignorée");
    return null;
  }

  return {
    provider: providerRaw as ByokProviderId,
    apiKey,
  };
}

/** Instancie un provider éphémère avec la clé client (pas de cache). */
export function createByokProvider(credentials: ByokCredentials): AIProvider {
  switch (credentials.provider) {
    case "anthropic":
      return new AnthropicProvider({ apiKey: credentials.apiKey });
    case "openai":
      return new OpenAIProvider({ apiKey: credentials.apiKey });
    case "mistral":
    default:
      return new MistralProvider({ apiKey: credentials.apiKey });
  }
}
