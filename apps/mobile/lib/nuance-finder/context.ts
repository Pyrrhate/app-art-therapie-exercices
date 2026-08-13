import i18n from "@/lib/i18n";
import type { ColorForImpulse } from "@/lib/color-names";
import { resolveColorLabel } from "@/lib/color-names";
import {
  elementLabel,
  elementQuality,
  type ElementKind,
} from "./elements";

export function buildNuanceAugmentationContext(params: {
  colors: ColorForImpulse[];
  harmonyName?: string;
  discoveredElements: ElementKind[];
  revealedCount: number;
  totalCells: number;
}): string {
  const names = [
    ...new Set(params.colors.map((c) => resolveColorLabel(c))),
  ].slice(0, 5);

  const elements = params.discoveredElements.map(
    (kind) => `${elementLabel(kind)} (${elementQuality(kind)})`
  );

  const lines = [
    i18n.t("amorces:nuanceFinder.context.header"),
    i18n.t("amorces:nuanceFinder.context.progress", {
      shown: params.revealedCount,
      total: params.totalCells,
    }),
  ];

  if (params.harmonyName?.trim()) {
    lines.push(
      i18n.t("amorces:nuanceFinder.context.named", {
        name: params.harmonyName.trim(),
      })
    );
  }
  if (names.length > 0) {
    lines.push(
      i18n.t("amorces:nuanceFinder.context.tones", { names: names.join(", ") })
    );
  }
  if (elements.length > 0) {
    lines.push(
      i18n.t("amorces:nuanceFinder.context.lotus", {
        elements: elements.join(", "),
      })
    );
  }

  return lines.join("\n");
}

export function buildNuanceImpulse(
  colors: ColorForImpulse[],
  harmonyName?: string
): string {
  const base =
    harmonyName?.trim() || i18n.t("amorces:nuanceFinder.defaultHarmony");
  const names = [
    ...new Set(colors.filter(Boolean).map((c) => resolveColorLabel(c))),
  ].slice(0, 4);
  return names.length > 0 ? `${base} : ${names.join(", ")}` : base;
}
