import i18n from "@/lib/i18n";
import { resolveColorLabel, type ColorForImpulse } from "@/lib/color-names";
import { elementLabel, type ElementKind } from "@/lib/nuance-finder/elements";
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
    lines.push(i18n.t("amorces:colorJourney.filContextHeader"));
  } else if (metadata.paletteSource === "nuances") {
    lines.push(i18n.t("amorces:nuanceFinder.filContextHeader"));
  }

  if (metadata.harmonyName?.trim()) {
    lines.push(
      i18n.t("amorces:nuanceFinder.context.named", {
        name: metadata.harmonyName.trim(),
      })
    );
  }

  const labels = metadata.paletteLabels?.filter(Boolean);
  if (labels?.length) {
    lines.push(
      i18n.t("amorces:nuanceFinder.context.tones", {
        names: labels.join(", "),
      })
    );
  } else if (metadata.colors?.length) {
    const names = metadata.colors
      .map((hex) => resolveColorLabel(hex))
      .slice(0, 5);
    if (names.length) {
      lines.push(
        i18n.t("amorces:nuanceFinder.context.tones", {
          names: names.join(", "),
        })
      );
    }
  }

  if (metadata.discoveredElements?.length) {
    lines.push(
      i18n.t("amorces:nuanceFinder.context.lotus", {
        elements: metadata.discoveredElements.join(", "),
      })
    );
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
  return kinds.map((kind) => elementLabel(kind));
}
