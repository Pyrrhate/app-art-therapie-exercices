import { hexToRgb, lerpRgb, rgbToHex, type Rgb } from "@/lib/nuance-finder/colors";

export type PaintPrimaryId = "red" | "yellow" | "blue";
export type PaintSecondaryId = "orange" | "green" | "violet";

export interface PaintSwatch {
  id: string;
  label: string;
  hex: string;
  rgb: Rgb;
  hue: number;
}

export interface MixRecipe {
  parts: string;
  description: string;
}

export const RYB_PRIMARIES: PaintSwatch[] = [
  {
    id: "red",
    label: "Rouge",
    hex: "#D62828",
    rgb: { r: 214, g: 40, b: 40 },
    hue: 0,
  },
  {
    id: "yellow",
    label: "Jaune",
    hex: "#F4A825",
    rgb: { r: 244, g: 168, b: 37 },
    hue: 42,
  },
  {
    id: "blue",
    label: "Bleu",
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
  label: string;
  mix: [PaintPrimaryId, PaintPrimaryId];
  recipe: MixRecipe;
}

export const RYB_SECONDARIES: SecondaryDef[] = [
  {
    id: "orange",
    label: "Orange",
    mix: ["red", "yellow"],
    recipe: {
      parts: "1 part rouge + 1 part jaune",
      description: "Mélangez progressivement le jaune dans le rouge sur la palette.",
    },
  },
  {
    id: "green",
    label: "Vert",
    mix: ["yellow", "blue"],
    recipe: {
      parts: "1 part jaune + 1 part bleu",
      description: "Le bleu domine vite — ajoutez-le par petites touches au jaune.",
    },
  },
  {
    id: "violet",
    label: "Violet",
    mix: ["blue", "red"],
    recipe: {
      parts: "1 part bleu + 1 part rouge",
      description: "Un violet chaud si le rouge domine, froid si le bleu domine.",
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
  bias: "primary" | "secondary"
): string {
  const primary = PRIMARY_BY_ID[primaryId].label.toLowerCase();
  const secondary = SECONDARY_BY_ID[secondaryId].label.toLowerCase();
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

export function getDimensionLabel(dimensionId: string): string {
  const labels: Record<string, string> = {
    primary: "Primaire",
    secondary: "Secondaire",
    tertiary: "Tertiaire",
    anchor: "Primaire",
    complement: "Secondaire",
    closure: "Tertiaire",
  };
  return labels[dimensionId] ?? dimensionId;
}
