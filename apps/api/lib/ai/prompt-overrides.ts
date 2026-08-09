import { PROMPT_IDS, sanitizePromptOverrides } from "@art-therapie/shared";
import { z } from "zod";

/** Schéma Zod pour les overrides de prompts (corps JSON des routes IA). */
export const promptOverridesSchema = z
  .record(z.string().max(12_000))
  .optional()
  .transform((value) => sanitizePromptOverrides(value));

export function parsePromptOverrides(raw: unknown) {
  const parsed = promptOverridesSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  return parsed.data;
}

export { PROMPT_IDS };
