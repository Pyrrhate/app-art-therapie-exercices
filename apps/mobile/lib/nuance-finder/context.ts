import type { ColorForImpulse } from "@/lib/color-names";
import { resolveColorLabel } from "@/lib/color-names";
import { ELEMENT_QUALITIES, ELEMENT_VISUALS, type ElementKind } from "./elements";

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
    (kind) =>
      `${ELEMENT_VISUALS[kind].label} (${ELEMENT_QUALITIES[kind]})`
  );

  const lines = [
    "Chercheur de Nuances Pastek Art — harmonie chromatique révélée.",
    `Progression : ${params.revealedCount}/${params.totalCells} teintes.`,
  ];

  if (params.harmonyName?.trim()) {
    lines.push(`Nom donné : ${params.harmonyName.trim()}.`);
  }
  if (names.length > 0) {
    lines.push(`Teintes dominantes : ${names.join(", ")}.`);
  }
  if (elements.length > 0) {
    lines.push(`Lotus découverts : ${elements.join(", ")}.`);
  }

  return lines.join("\n");
}

export function buildNuanceImpulse(
  colors: ColorForImpulse[],
  harmonyName?: string
): string {
  const base = harmonyName?.trim() || "Harmonie chromatique";
  const names = [
    ...new Set(colors.filter(Boolean).map((c) => resolveColorLabel(c))),
  ].slice(0, 4);
  return names.length > 0 ? `${base} : ${names.join(", ")}` : base;
}
