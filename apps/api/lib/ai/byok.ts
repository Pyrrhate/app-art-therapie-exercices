/**
 * Extraction BYOK depuis headers HTTP et/ou corps JSON.
 * La clé n'est jamais loguée ni persistée — usage mémoire uniquement.
 */
import { z } from "zod";
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

/** Schéma pour `byok` dans le corps JSON (plus fiable que les headers custom). */
export const byokBodySchema = z
  .object({
    provider: z.enum(["mistral", "anthropic", "openai"]),
    apiKey: z.string().min(8).max(500),
  })
  .optional();

function headerValue(request: Request, name: string): string | null {
  return request.headers.get(name)?.trim() || null;
}

function normalizeCredentials(
  providerRaw: string | null | undefined,
  apiKeyRaw: string | null | undefined
): ByokCredentials | null {
  const provider = providerRaw?.trim().toLowerCase();
  const apiKey = apiKeyRaw?.trim();

  if (!provider && !apiKey) return null;

  if (!provider || !apiKey) {
    console.warn("[byok] credentials incomplets (provider ou clé manquant)");
    return null;
  }

  if (!VALID_PROVIDERS.has(provider as ByokProviderId)) {
    console.warn("[byok] provider inconnu");
    return null;
  }

  if (apiKey.length < 8) {
    console.warn("[byok] clé trop courte — ignorée");
    return null;
  }

  return {
    provider: provider as ByokProviderId,
    apiKey,
  };
}

/**
 * Lit les headers BYOK. Retourne null si absents ou invalides.
 * Ne logue jamais la clé.
 */
export function extractByokCredentials(
  request: Request
): ByokCredentials | null {
  return normalizeCredentials(
    headerValue(request, BYOK_PROVIDER_HEADER),
    headerValue(request, BYOK_KEY_HEADER)
  );
}

/** Lit un objet `{ provider, apiKey }` déjà parsé depuis le corps JSON. */
export function byokFromBody(
  value: { provider?: string; apiKey?: string } | null | undefined
): ByokCredentials | null {
  if (!value) return null;
  return normalizeCredentials(value.provider, value.apiKey);
}

/** Priorité : corps JSON (fiable) puis headers. */
export function resolveByokCredentials(
  request: Request,
  bodyByok?: { provider?: string; apiKey?: string } | null
): ByokCredentials | null {
  return byokFromBody(bodyByok) ?? extractByokCredentials(request);
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
