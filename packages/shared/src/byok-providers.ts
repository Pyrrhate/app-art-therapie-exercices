/**
 * Catalogue des moteurs BYOK (client + API).
 * Les clés / URLs restent sur l'appareil ; le serveur ne fait que relayer.
 */

export const BYOK_PROVIDER_IDS = [
  "mistral",
  "scaleway",
  "ovhcloud",
  "alephalpha",
  "ollama",
  "openai",
  "anthropic",
  "gemini",
] as const;

export type ByokProviderId = (typeof BYOK_PROVIDER_IDS)[number];

export const EUROPEAN_BYOK_PROVIDERS: readonly ByokProviderId[] = [
  "mistral",
  "scaleway",
  "ovhcloud",
  "alephalpha",
  "ollama",
] as const;

export const GLOBAL_BYOK_PROVIDERS: readonly ByokProviderId[] = [
  "openai",
  "anthropic",
  "gemini",
] as const;

/** Instruction de sécurité créative (non clinique) — injectée côté providers. */
export const CREATIVE_COACH_SAFETY = `You are a creative coach and generator of artistic exercises (not a therapist). Your goal is to suggest creative, artistic, and reflective activities for personal well-being and playful exploration. NEVER give medical diagnoses, psychological evaluations, or clinical advice. Never claim to provide art therapy or treatment. Always maintain an encouraging, open-ended, and metaphor-driven tone. Respond in French with vousvoiement.`;

export function isByokProviderId(value: string): value is ByokProviderId {
  return (BYOK_PROVIDER_IDS as readonly string[]).includes(value);
}
