/**
 * Extraction BYOK depuis headers HTTP et/ou corps JSON.
 * La clé n'est jamais loguée ni persistée — usage mémoire uniquement.
 */
import {
  BYOK_PROVIDER_IDS,
  isByokProviderId,
  type ByokProviderId,
} from "@art-therapie/shared";
import { z } from "zod";
import type { AIProvider } from "../types";
import { createAiAdapter } from "./adapter";

export const BYOK_PROVIDER_HEADER = "x-custom-ai-provider";
export const BYOK_KEY_HEADER = "x-custom-ai-key";

export type { ByokProviderId };

export interface ByokCredentials {
  provider: ByokProviderId;
  apiKey: string;
}

const providerEnum = z.enum(
  BYOK_PROVIDER_IDS as unknown as [ByokProviderId, ...ByokProviderId[]]
);

/** Schéma pour `byok` dans le corps JSON (plus fiable que les headers custom). */
export const byokBodySchema = z
  .object({
    provider: providerEnum,
    /** Clé API, ou URL de base pour Ollama. */
    apiKey: z.string().min(7).max(500),
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

  if (!isByokProviderId(provider)) {
    console.warn("[byok] provider inconnu");
    return null;
  }

  const minLen = provider === "ollama" ? 7 : 8;
  if (apiKey.length < minLen) {
    console.warn("[byok] clé trop courte — ignorée");
    return null;
  }

  return { provider, apiKey };
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
  return createAiAdapter(credentials);
}
