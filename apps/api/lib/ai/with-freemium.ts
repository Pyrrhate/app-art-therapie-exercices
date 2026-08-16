import {
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
  if (
    byok === "openai" ||
    byok === "anthropic" ||
    byok === "mistral" ||
    byok === "gemini" ||
    byok === "scaleway" ||
    byok === "ovhcloud" ||
    byok === "alephalpha" ||
    byok === "ollama" ||
    byok === "cohere"
  ) {
    return byok;
  }
  return usePremiumLlm ? "mistral" : "huggingface";
}

/**
 * Exécute un appel IA avec priorité BYOK :
 * 1. Corps JSON `byok` ou headers X-Custom-AI-* → provider éphémère
 * 2. Sinon freemium (HF gratuit / Mistral si tier premium)
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
      withNote.fallbackNote = `Votre clé ${byok.provider} n’a pas pu générer la réponse. Vérifiez la clé et le solde / plan sur le tableau de bord du fournisseur.`;
    }
  }

  recordAiUsageEvent({
    eventType: options.eventType,
    userId: ctx.userId,
    source: result.source === "ai" ? "ai" : "fallback",
    provider: usageProviderLabel(byok?.provider ?? null, ctx.usePremiumLlm),
  });

  const extraHeaders: Record<string, string> = {
    ...freemiumResponseHeaders(ctx),
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
