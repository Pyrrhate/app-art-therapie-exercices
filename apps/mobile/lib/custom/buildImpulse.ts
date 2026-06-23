import type { CustomSessionConfig } from "./types";
import { CUSTOM_TECHNIQUE_CATEGORIES } from "./types";

export function buildCustomImpulse(config: CustomSessionConfig): string {
  const categoryLabel =
    CUSTOM_TECHNIQUE_CATEGORIES.find((c) => c.id === config.technique)?.label ??
    config.technique;

  const impulse = [
    config.theme,
    config.emotion,
    `objectif ${config.goal.toLowerCase()}`,
    categoryLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return impulse.slice(0, 200);
}
