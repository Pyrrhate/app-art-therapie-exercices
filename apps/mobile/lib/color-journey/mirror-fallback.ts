import i18n from "@/lib/i18n";
import { getDimensionLabel } from "./painting-theory";

export function buildLocalColorMirror(payload: {
  mode: "turn" | "synthesis";
  chosen?: { label: string; dimensionId: string };
  history: Array<{ label: string; dimensionId: string }>;
}): string {
  const labels = payload.history.map((h) => h.label).join(", ");

  if (payload.mode === "synthesis") {
    return labels
      ? i18n.t("amorces:colorJourney.mirror.synthesisWithLabels", { labels })
      : i18n.t("amorces:colorJourney.mirror.synthesisEmpty");
  }

  const chosen =
    payload.chosen?.label ?? i18n.t("amorces:colorJourney.mirror.thisShade");
  const dim = getDimensionLabel(payload.chosen?.dimensionId ?? "");
  return i18n.t("amorces:colorJourney.mirror.turn", { chosen, dim });
}
