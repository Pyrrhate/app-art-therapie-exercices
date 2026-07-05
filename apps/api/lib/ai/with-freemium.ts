import {
  consumePremiumSession,
  freemiumResponseHeaders,
  resolveFreemiumContext,
  type FreemiumContext,
} from "@/lib/auth/freemium";
import { getAIProviderForFreemium } from "./router";
import type { AIProvider } from "../types";

interface FreemiumAiResult<T> {
  result: T;
  extraHeaders: Record<string, string>;
}

/** Exécute un appel IA avec routage free/premium et consommation de balance si besoin. */
export async function withFreemiumAI<T extends { source?: string }>(
  request: Request,
  run: (provider: AIProvider, ctx: FreemiumContext) => Promise<T>
): Promise<FreemiumAiResult<T>> {
  const ctx = await resolveFreemiumContext(request);
  const provider = getAIProviderForFreemium(ctx.usePremiumLlm);
  const result = await run(provider, ctx);

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
