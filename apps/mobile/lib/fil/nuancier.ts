import { resolveColorLabel, type ColorForImpulse } from "@/lib/color-names";
import { ELEMENT_VISUALS, type ElementKind } from "@/lib/nuance-finder/elements";
import type { FilEntry, FilMetadata } from "./types";

export function isNuancierFilEntry(entry: FilEntry): boolean {
  return entry.source === "nuances" || entry.source === "color-journey";
}

/** Reconstruit le contexte chromatique depuis les métadonnées Fil. */
export function buildColorContextFromMetadata(
  metadata: FilMetadata
): string | undefined {
  if (metadata.colorContext?.trim()) {
    return metadata.colorContext.trim();
  }

  const lines: string[] = [];
  if (metadata.paletteSource === "color-journey") {
    lines.push("Palette intérieure Pastek Art.");
  } else if (metadata.paletteSource === "nuances") {
    lines.push("Chercheur de Nuances Pastek Art.");
  }

  if (metadata.harmonyName?.trim()) {
    lines.push(`Harmonie : ${metadata.harmonyName.trim()}.`);
  }

  const labels = metadata.paletteLabels?.filter(Boolean);
  if (labels?.length) {
    lines.push(`Teintes : ${labels.join(", ")}.`);
  } else if (metadata.colors?.length) {
    const names = metadata.colors
      .map((hex) => resolveColorLabel(hex))
      .slice(0, 5);
    if (names.length) lines.push(`Teintes : ${names.join(", ")}.`);
  }

  if (metadata.discoveredElements?.length) {
    lines.push(`Lotus : ${metadata.discoveredElements.join(", ")}.`);
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function metadataToPaletteColors(metadata: FilMetadata): string[] {
  return metadata.colors?.filter(Boolean) ?? [];
}

export function colorsToFilMetadata(
  colors: ColorForImpulse[]
): Pick<FilMetadata, "colors" | "paletteLabels"> {
  const hexes: string[] = [];
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const color of colors) {
    const hex = (typeof color === "string" ? color : color.hex).toUpperCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    hexes.push(hex);
    labels.push(resolveColorLabel(color));
  }

  return { colors: hexes, paletteLabels: labels };
}

export function elementKindsToLabels(kinds: ElementKind[]): string[] {
  return kinds.map((kind) => ELEMENT_VISUALS[kind].label);
}
