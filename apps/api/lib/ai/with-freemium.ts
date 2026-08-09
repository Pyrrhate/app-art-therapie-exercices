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
  extractByokCredentials,
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
 * 1. Headers X-Custom-AI-* → provider éphémère (clé client, jamais stockée)
 * 2. Sinon freemium (Mistral crédits / Hugging Face)
 * 3. Les providers gèrent leur propre fallback local
 */
export async function withFreemiumAI<T extends { source?: string }>(
  request: Request,
  options: WithFreemiumAIOptions<T>
): Promise<FreemiumAiResult<T>> {
  const ctx = await resolveFreemiumContext(request);
  const byok = extractByokCredentials(request);

  const provider = byok
    ? createByokProvider(byok)
    : getAIProviderForFreemium(ctx.usePremiumLlm);

  const result = await options.run(provider, ctx);

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
  }

  return { result, extraHeaders };
}
