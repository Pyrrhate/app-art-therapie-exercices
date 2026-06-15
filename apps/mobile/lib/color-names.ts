import { hexToRgb } from "@/lib/nuance-finder/colors";

function rgbToHsl(r: number, g: number, b: number): {
  h: number;
  s: number;
  l: number;
} {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

const HUE_NAMES: Array<{ min: number; max: number; name: string }> = [
  { min: 0, max: 15, name: "rouge" },
  { min: 15, max: 45, name: "orange" },
  { min: 45, max: 70, name: "ocre" },
  { min: 70, max: 150, name: "vert" },
  { min: 150, max: 190, name: "turquoise" },
  { min: 190, max: 250, name: "bleu" },
  { min: 250, max: 290, name: "violet" },
  { min: 290, max: 330, name: "magenta" },
  { min: 330, max: 360, name: "rouge" },
];

function lightnessModifier(l: number): string {
  if (l >= 0.88) return "pâle";
  if (l >= 0.72) return "clair";
  if (l <= 0.22) return "profond";
  if (l <= 0.38) return "sombre";
  return "";
}

function saturationModifier(s: number, l: number): string {
  if (s < 0.12 && l > 0.85) return "crème";
  if (s < 0.12) return "gris";
  if (s < 0.25) return "brume";
  return "";
}

/** Nom poétique court pour une couleur hex — utilisé dans les impulsions rituel. */
export function hexToColorLabel(hex: string): string {
  const normalized = hex.trim().toUpperCase();
  if (!normalized || normalized === "#FFFFFF" || normalized === "#FAF7F4") {
    return "crème";
  }

  const { r, g, b } = hexToRgb(normalized);
  const { h, s, l } = rgbToHsl(r, g, b);

  const neutral = saturationModifier(s, l);
  if (neutral === "crème") return "crème";
  if (neutral === "gris") {
    return l > 0.6 ? "gris clair" : "gris doux";
  }

  const hue =
    HUE_NAMES.find((band) => h >= band.min && h < band.max)?.name ?? "teinte";
  const light = lightnessModifier(l);
  const sat = neutral === "brume" ? " brumeux" : "";

  if (light && sat) return `${hue} ${light}${sat}`.trim();
  if (light) return `${hue} ${light}`.trim();
  if (sat) return `${hue}${sat}`.trim();
  return hue;
}

export type ColorForImpulse = string | { hex: string; label?: string };

export function resolveColorLabel(entry: ColorForImpulse): string {
  if (typeof entry === "object" && entry.label?.trim()) {
    return entry.label.trim();
  }
  const hex = typeof entry === "string" ? entry : entry.hex;
  return hexToColorLabel(hex);
}
