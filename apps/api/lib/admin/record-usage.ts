import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AiUsageEventType } from "./usage-types";

export type AiUsageSource = "ai" | "fallback";
export type AiUsageProvider =
  | "huggingface"
  | "mistral"
  | "openai"
  | "anthropic"
  | "gemini"
  | "scaleway"
  | "ovhcloud"
  | "alephalpha"
  | "ollama"
  | "cohere"
  | "local";

export interface RecordAiUsageInput {
  eventType: AiUsageEventType;
  userId: string | null;
  source: AiUsageSource;
  provider?: AiUsageProvider;
}

/** Enregistre un appel IA — fire-and-forget, ne bloque jamais la réponse API. */
export function recordAiUsageEvent(input: RecordAiUsageInput): void {
  void (async () => {
    const admin = getSupabaseAdmin();
    if (!admin) return;

    const { error } = await admin.from("ai_usage_events").insert({
      event_type: input.eventType,
      user_id: input.userId,
      source: input.source,
      provider: input.provider ?? null,
    });

    if (error) {
      console.warn("[ai_usage_events]", error.message);
    }
  })();
}
