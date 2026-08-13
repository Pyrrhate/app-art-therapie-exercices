import i18n from "@/lib/i18n";
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
    i18n.t("amorces:colorJourney.context.header"),
    usage,
    i18n.t("amorces:colorJourney.context.scheme", {
      scheme: history.map((_, i) => getDimensionForTurn(i + 1).title).join(" → "),
    }),
    i18n.t("amorces:colorJourney.context.ratio"),
  ].join("\n");
}

export function buildPaletteImpulse(history: ColorChoice[]): string {
  const labels = history.map((h) => h.label).join(", ");
  return labels
    ? i18n.t("amorces:colorJourney.synthesis.impulse", { labels })
    : i18n.t("amorces:colorJourney.synthesis.impulseEmpty");
}
