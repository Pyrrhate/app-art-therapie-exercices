import {
  consumePremiumSession,
  freemiumResponseHeaders,
  resolveFreemiumContext,
  type FreemiumContext,
} from "@/lib/auth/freemium";
import { recordAiUsageEvent } from "@/lib/admin/record-usage";
import type { AiUsageEventType } from "@/lib/admin/usage-types";
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

/** Exécute un appel IA avec routage free/premium et consommation de balance si besoin. */
export async function withFreemiumAI<T extends { source?: string }>(
  request: Request,
  options: WithFreemiumAIOptions<T>
): Promise<FreemiumAiResult<T>> {
  const ctx = await resolveFreemiumContext(request);
  const provider = getAIProviderForFreemium(ctx.usePremiumLlm);
  const result = await options.run(provider, ctx);

  recordAiUsageEvent({
    eventType: options.eventType,
    userId: ctx.userId,
    source: result.source === "ai" ? "ai" : "fallback",
    provider: ctx.usePremiumLlm ? "mistral" : "huggingface",
  });

  let balanceAfter: number | null = null;
  if (
    ctx.decrementBalanceOnSuccess &&
    ctx.userId &&
    result.source === "ai"
  ) {
    balanceAfter = await consumePremiumSession(ctx.userId);
  }

  return {
    result,
    extraHeaders: freemiumResponseHeaders(ctx, balanceAfter),
  };
}
