import { getDimensionForTurn } from "./dimensions";
import type { ColorChoice } from "./types";

/** Contexte enrichi pour la génération d'exercice IA. */
export function buildPaletteAugmentationContext(
  history: ColorChoice[]
): string {
  if (history.length === 0) return "";

  const lines = history.map((choice, index) => {
    const dim = getDimensionForTurn(index + 1);
    return `Tour ${index + 1} (${dim.title}) : ${choice.label} (${choice.hex})`;
  });

  return [
    "Palette intérieure Pastek Art — parcours chromatique guidé.",
    ...lines,
    `Schéma : ${history.map((_, i) => getDimensionForTurn(i + 1).title).join(" → ")}.`,
  ].join("\n");
}

export function buildPaletteImpulse(history: ColorChoice[]): string {
  const labels = history.map((h) => h.label).join(", ");
  return labels ? `Palette intérieure : ${labels}` : "Palette intérieure";
}
