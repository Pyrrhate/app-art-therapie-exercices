import type { LocalizedText } from "@/lib/i18n/types";
import { pickLocalized } from "@/lib/i18n/localize";
import { hexToRgb } from "@/lib/nuance-finder/colors";

type HueBand = { min: number; max: number; name: LocalizedText };

const HUE_NAMES: HueBand[] = [
  { min: 0, max: 15, name: { fr: "rouge", en: "red" } },
  { min: 15, max: 45, name: { fr: "orange", en: "orange" } },
  { min: 45, max: 70, name: { fr: "ocre", en: "ochre" } },
  { min: 70, max: 150, name: { fr: "vert", en: "green" } },
  { min: 150, max: 190, name: { fr: "turquoise", en: "turquoise" } },
  { min: 190, max: 250, name: { fr: "bleu", en: "blue" } },
  { min: 250, max: 290, name: { fr: "violet", en: "violet" } },
  { min: 290, max: 330, name: { fr: "magenta", en: "magenta" } },
  { min: 330, max: 360, name: { fr: "rouge", en: "red" } },
];

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
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

function lightnessModifier(l: number): LocalizedText | null {
  if (l >= 0.88) return { fr: "pâle", en: "pale" };
  if (l >= 0.72) return { fr: "clair", en: "light" };
  if (l <= 0.22) return { fr: "profond", en: "deep" };
  if (l <= 0.38) return { fr: "sombre", en: "dark" };
  return null;
}

type NeutralKind = "creme" | "gris" | "brume" | null;

function saturationModifier(s: number, l: number): NeutralKind {
  if (s < 0.12 && l > 0.85) return "creme";
  if (s < 0.12) return "gris";
  if (s < 0.25) return "brume";
  return null;
}

/** Nom poétique court pour une couleur hex — utilisé dans les impulsions rituel. */
export function hexToColorLabel(hex: string): string {
  const normalized = hex.trim().toUpperCase();
  if (!normalized || normalized === "#FFFFFF" || normalized === "#FAF7F4") {
    return pickLocalized({ fr: "crème", en: "cream" });
  }

  const { r, g, b } = hexToRgb(normalized);
  const { h, s, l } = rgbToHsl(r, g, b);

  const neutral = saturationModifier(s, l);
  if (neutral === "creme") return pickLocalized({ fr: "crème", en: "cream" });
  if (neutral === "gris") {
    return l > 0.6
      ? pickLocalized({ fr: "gris clair", en: "light grey" })
      : pickLocalized({ fr: "gris doux", en: "soft grey" });
  }

  const hue =
    pickLocalized(
      HUE_NAMES.find((band) => h >= band.min && h < band.max)?.name ?? {
        fr: "teinte",
        en: "hue",
      }
    );
  const light = lightnessModifier(l);
  const lightLabel = light ? pickLocalized(light) : "";
  const misty = neutral === "brume"
    ? pickLocalized({ fr: " brumeux", en: " misty" })
    : "";

  if (lightLabel && misty) return `${hue} ${lightLabel}${misty}`.trim();
  if (lightLabel) return `${hue} ${lightLabel}`.trim();
  if (misty) return `${hue}${misty}`.trim();
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
