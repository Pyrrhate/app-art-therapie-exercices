import { hexToRgb, lerpRgb, rgbToHex, type Rgb } from "@/lib/nuance-finder/colors";
import type { LocalizedText } from "@/lib/i18n/types";
import { pickLocalized } from "@/lib/i18n/localize";

export type PaintPrimaryId = "red" | "yellow" | "blue";
export type PaintSecondaryId = "orange" | "green" | "violet";

export interface PaintSwatch {
  id: string;
  label: LocalizedText;
  hex: string;
  rgb: Rgb;
  hue: number;
}

export interface MixRecipe {
  parts: LocalizedText;
  description: LocalizedText;
}

export const RYB_PRIMARIES: PaintSwatch[] = [
  {
    id: "red",
    label: { fr: "Rouge", en: "Red" },
    hex: "#D62828",
    rgb: { r: 214, g: 40, b: 40 },
    hue: 0,
  },
  {
    id: "yellow",
    label: { fr: "Jaune", en: "Yellow" },
    hex: "#F4A825",
    rgb: { r: 244, g: 168, b: 37 },
    hue: 42,
  },
  {
    id: "blue",
    label: { fr: "Bleu", en: "Blue" },
    hex: "#1D6AA5",
    rgb: { r: 29, g: 106, b: 165 },
    hue: 210,
  },
];

const PRIMARY_BY_ID = Object.fromEntries(
  RYB_PRIMARIES.map((p) => [p.id, p])
) as Record<PaintPrimaryId, PaintSwatch>;

export interface SecondaryDef {
  id: PaintSecondaryId;
  label: LocalizedText;
  mix: [PaintPrimaryId, PaintPrimaryId];
  recipe: MixRecipe;
}

export const RYB_SECONDARIES: SecondaryDef[] = [
  {
    id: "orange",
    label: { fr: "Orange", en: "Orange" },
    mix: ["red", "yellow"],
    recipe: {
      parts: {
        fr: "1 part rouge + 1 part jaune",
        en: "1 part red + 1 part yellow",
      },
      description: {
        fr: "Mélangez progressivement le jaune dans le rouge sur la palette.",
        en: "Gradually mix yellow into the red on the palette.",
      },
    },
  },
  {
    id: "green",
    label: { fr: "Vert", en: "Green" },
    mix: ["yellow", "blue"],
    recipe: {
      parts: {
        fr: "1 part jaune + 1 part bleu",
        en: "1 part yellow + 1 part blue",
      },
      description: {
        fr: "Le bleu domine vite — ajoutez-le par petites touches au jaune.",
        en: "Blue takes over quickly — add it to the yellow in small touches.",
      },
    },
  },
  {
    id: "violet",
    label: { fr: "Violet", en: "Violet" },
    mix: ["blue", "red"],
    recipe: {
      parts: {
        fr: "1 part bleu + 1 part rouge",
        en: "1 part blue + 1 part red",
      },
      description: {
        fr: "Un violet chaud si le rouge domine, froid si le bleu domine.",
        en: "A warm violet if red dominates, cool if blue does.",
      },
    },
  },
];

const SECONDARY_BY_ID = Object.fromEntries(
  RYB_SECONDARIES.map((s) => [s.id, s])
) as Record<PaintSecondaryId, SecondaryDef>;

/** Secondaires adjacentes à une primaire choisie. */
export function getSecondariesForPrimary(
  primaryId: PaintPrimaryId
): SecondaryDef[] {
  return RYB_SECONDARIES.filter((s) => s.mix.includes(primaryId));
}

export function paintLabel(
  paint: { label: LocalizedText },
  language?: import("@/lib/i18n/types").AppLanguage
): string {
  return pickLocalized(paint.label, language);
}

export function mixSecondaryHex(secondary: SecondaryDef): string {
  const [a, b] = secondary.mix;
  return rgbToHex(lerpRgb(PRIMARY_BY_ID[a].rgb, PRIMARY_BY_ID[b].rgb, 0.5));
}

export function mixTertiaryHex(
  primaryId: PaintPrimaryId,
  secondaryId: PaintSecondaryId,
  bias: "primary" | "secondary"
): string {
  const primary = PRIMARY_BY_ID[primaryId].rgb;
  const secondaryRgb = hexToRgb(mixSecondaryHex(SECONDARY_BY_ID[secondaryId]));
  const t = bias === "primary" ? 0.68 : 0.32;
  return rgbToHex(lerpRgb(primary, secondaryRgb, 1 - t));
}

export function tertiaryLabel(
  primaryId: PaintPrimaryId,
  secondaryId: PaintSecondaryId,
  bias: "primary" | "secondary",
  language?: import("@/lib/i18n/types").AppLanguage
): string {
  const primary = paintLabel(PRIMARY_BY_ID[primaryId], language).toLowerCase();
  const secondary = paintLabel(
    SECONDARY_BY_ID[secondaryId],
    language
  ).toLowerCase();
  return bias === "primary"
    ? `${primary}-${secondary}`
    : `${secondary}-${primary}`;
}

export function inferPrimaryFromHue(hue: number): PaintPrimaryId {
  const distances = RYB_PRIMARIES.map((p) => ({
    id: p.id as PaintPrimaryId,
    d: Math.min(Math.abs(hue - p.hue), 360 - Math.abs(hue - p.hue)),
  }));
  distances.sort((a, b) => a.d - b.d);
  return distances[0]!.id;
}

export function getDimensionLabel(
  dimensionId: string,
  language?: import("@/lib/i18n/types").AppLanguage
): string {
  const labels: Record<string, LocalizedText> = {
    primary: { fr: "Primaire", en: "Primary" },
    secondary: { fr: "Secondaire", en: "Secondary" },
    tertiary: { fr: "Tertiaire", en: "Tertiary" },
    anchor: { fr: "Primaire", en: "Primary" },
    complement: { fr: "Secondaire", en: "Secondary" },
    closure: { fr: "Tertiaire", en: "Tertiary" },
  };
  const text = labels[dimensionId];
  return text ? pickLocalized(text, language) : dimensionId;
}
