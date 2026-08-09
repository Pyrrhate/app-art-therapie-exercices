import {
  consumePremiumSession,
  freemiumResponseHeaders,
  resolveFreemiumContext,
  type FreemiumContext,
} from "@/lib/auth/freemium";
import { recordAiUsageEvent } from "@/lib/admin/record-usage";
import type { AiUsageEventType } from "@/lib/admin/usage-types";
import type { AiUsageProvider } from "@/lib/admin/record-usage";
import {
  createByokProvider,
  resolveByokCredentials,
  type ByokCredentials,
  type ByokProviderId,
} from "./byok";
import { getAIProviderForFreemium } from "./router";
import type { AIProvider } from "../types";

interface FreemiumAiResult<T> {
  result: T;
  extraHeaders: Record<string, string>;
}

interface WithFreemiumAIOptions<T> {
  eventType: AiUsageEventType;
  run: (provider: AIProvider, ctx: FreemiumContext) => Promise<T>;
  /** Credentials BYOK issus du corps JSON (prioritaires sur les headers). */
  byokFromBody?: { provider?: string; apiKey?: string } | null;
}

function usageProviderLabel(
  byok: ByokProviderId | null,
  usePremiumLlm: boolean
): AiUsageProvider {
  if (byok === "openai") return "openai";
  if (byok === "anthropic") return "anthropic";
  if (byok === "mistral") return "mistral";
  return usePremiumLlm ? "mistral" : "huggingface";
}

/**
 * Exécute un appel IA avec priorité BYOK :
 * 1. Corps JSON `byok` ou headers X-Custom-AI-* → provider éphémère
 * 2. Sinon freemium (Mistral crédits / Hugging Face)
 * 3. Les providers gèrent leur propre fallback local
 */
export async function withFreemiumAI<T extends { source?: string }>(
  request: Request,
  options: WithFreemiumAIOptions<T>
): Promise<FreemiumAiResult<T>> {
  const ctx = await resolveFreemiumContext(request);
  const byok: ByokCredentials | null = resolveByokCredentials(
    request,
    options.byokFromBody
  );

  if (byok) {
    console.info("[byok] relay actif:", byok.provider);
  }

  const provider = byok
    ? createByokProvider(byok)
    : getAIProviderForFreemium(ctx.usePremiumLlm);

  const result = await options.run(provider, ctx);

  if (byok && result.source === "fallback") {
    console.warn(
      "[byok] provider",
      byok.provider,
      "a renvoyé un fallback (clé invalide, quota ou réponse non exploitable)"
    );
    const withNote = result as T & { fallbackNote?: string };
    if (!withNote.fallbackNote) {
      withNote.fallbackNote = `Votre clé ${byok.provider} n’a pas pu générer la réponse (clé invalide, quota dépassé ou format inattendu). Exercice guidé local affiché.`;
    }
  }

  recordAiUsageEvent({
    eventType: options.eventType,
    userId: ctx.userId,
    source: result.source === "ai" ? "ai" : "fallback",
    provider: usageProviderLabel(byok?.provider ?? null, ctx.usePremiumLlm),
  });

  // BYOK : pas de consommation des crédits Premium Pastek
  let balanceAfter: number | null = null;
  if (
    !byok &&
    ctx.decrementBalanceOnSuccess &&
    ctx.userId &&
    result.source === "ai"
  ) {
    balanceAfter = await consumePremiumSession(ctx.userId);
  }

  const extraHeaders: Record<string, string> = {
    ...freemiumResponseHeaders(ctx, balanceAfter),
  };

  if (byok) {
    extraHeaders["X-Llm-Tier"] = "byok";
    extraHeaders["X-Byok-Provider"] = byok.provider;
    if (result.source === "fallback") {
      extraHeaders["X-Byok-Fallback"] = "1";
    }
  }

  return { result, extraHeaders };
}
