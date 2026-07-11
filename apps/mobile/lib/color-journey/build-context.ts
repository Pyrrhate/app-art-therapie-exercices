import { getDimensionForTurn } from "./dimensions";
import { buildPaletteUsageGuide } from "./theory";
import type { ColorChoice } from "./types";

/** Contexte enrichi pour la génération d'exercice IA. */
export function buildPaletteAugmentationContext(
  history: ColorChoice[]
): string {
  if (history.length === 0) return "";

  const usage = buildPaletteUsageGuide(history);

  return [
    "Assistant palette peinture Pastek Art — théorie RYB (primaires, secondaires, tertiaires).",
    usage,
    `Schéma : ${history.map((_, i) => getDimensionForTurn(i + 1).title).join(" → ")}.`,
    "Ratio conseillé : 60 % primaire · 30 % secondaire · 10 % tertiaire.",
  ].join("\n");
}

export function buildPaletteImpulse(history: ColorChoice[]): string {
  const labels = history.map((h) => h.label).join(", ");
  return labels ? `Palette peinture : ${labels}` : "Palette peinture";
}
