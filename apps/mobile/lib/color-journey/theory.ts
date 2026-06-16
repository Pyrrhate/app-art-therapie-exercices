import { hexToColorLabel } from "@/lib/color-names";
import { hexToRgb, rgbToHex } from "@/lib/nuance-finder/colors";
import { getDimensionForTurn } from "./dimensions";
import type { ColorChoice, ColorProposal, JourneyReflection, JourneySynthesis } from "./types";

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const light = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g =  0;
  let b = 0;
  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return rgbToHex({
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  });
}

export type LightnessPreset = "clair" | "moyen" | "profond";

const LIGHTNESS_VALUES: Record<LightnessPreset, number> = {
  clair: 0.62,
  moyen: 0.48,
  profond: 0.34,
};

export function hexFromHue(hue: number, preset: LightnessPreset = "moyen"): string {
  return hslToHex(hue, 0.72, LIGHTNESS_VALUES[preset]);
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function complementaryHue(hue: number): number {
  return (hue + 180) % 360;
}

export function triadicHues(hue: number): [number, number] {
  return [(hue + 120) % 360, (hue + 240) % 360];
}

export function pickTriadicHue(anchorHue: number, secondHue: number): number {
  const [a, b] = triadicHues(anchorHue);
  return hueDistance(a, secondHue) >= hueDistance(b, secondHue) ? a : b;
}

export interface TurnGuidance {
  title: string;
  subtitle: string;
  theory: string;
  highlightHues: number[];
  highlightSpread: number;
}

export function getTurnGuidance(turn: number, history: ColorChoice[]): TurnGuidance {
  const dim = getDimensionForTurn(turn);

  if (turn === 1) {
    return {
      title: dim.title,
      subtitle: "Choisissez librement une teinte sur la roue — votre point d'ancrage.",
      theory:
        "Sur le cercle chromatique, chaque teinte porte une qualité propre. Commencez par celle qui vous attire sans justification.",
      highlightHues: [],
      highlightSpread: 0,
    };
  }

  const anchor = hexToHsl(history[0]!.hex);
  const complement = complementaryHue(anchor.h);

  if (turn === 2) {
    return {
      title: dim.title,
      subtitle: "La complémentaire fait résonner votre ancrage — teintes opposées sur la roue.",
      theory: `Votre ${history[0]!.label} trouve son écho à l'opposé du cercle chromatique (~180°). Cette tension crée de la vivacité sans rupture.`,
      highlightHues: [complement],
      highlightSpread: 28,
    };
  }

  const second = hexToHsl(history[1]!.hex);
  const third = pickTriadicHue(anchor.h, second.h);

  return {
    title: dim.title,
    subtitle: "Une troisième teinte pour unir la palette — triade ou voisinage harmonique.",
    theory: `Après ancrage et complémentaire, une teinte triadique (${Math.round(third)}°) ou voisine équilibre l'ensemble sans l'aplatir.`,
    highlightHues: [third, (third + 30) % 360, (third - 30 + 360) % 360],
    highlightSpread: 22,
  };
}

export function proposalFromSelection(
  hue: number,
  preset: LightnessPreset
): ColorProposal {
  const hex = hexFromHue(hue, preset);
  const label = hexToColorLabel(hex);
  return {
    hex,
    label,
    hint: `Teinte ${label.toLowerCase()} — ${preset}`,
  };
}

export function buildReflection(
  turn: number,
  chosen: ColorProposal,
  history: ColorChoice[]
): JourneyReflection {
  const dim = getDimensionForTurn(turn);
  const guidance = getTurnGuidance(turn, history);

  let psychology = "";
  if (turn === 1) {
    psychology =
      "Le premier choix chromatique oriente souvent l'atmosphère de la création — accueillez-le comme un point de départ, pas une étiquette.";
  } else if (turn === 2) {
    psychology = `Face à ${history[0]?.label}, ${chosen.label} apporte une réponse contrastée : l'œil perçoit d'abord la relation entre les deux.`;
  } else {
    psychology = `Vos trois teintes forment un petit système : chaque nuance modère ou amplifie les autres.`;
  }

  return {
    reflection: `${chosen.label} rejoint votre palette — laissez cette teinte résonner un instant.`,
    psychology,
    theory: guidance.theory,
    question:
      turn < 3
        ? "Où sentez-vous cette couleur dans votre corps ou votre humeur ?"
        : undefined,
    turn,
    chosen,
  };
}

export function buildSynthesis(history: ColorChoice[]): JourneySynthesis {
  const labels = history.map((h) => h.label).join(", ");
  const relations =
    history.length >= 3
      ? "Ancrage, complémentaire et harmonie triadique tissent une palette cohérente."
      : "Deux teintes déjà suffisent pour une impulsion — vous pouvez continuer ou passer à l'exercice.";

  return {
    summary: `${relations} Votre palette : ${labels}.`,
    suggestedImpulse: `Palette intérieure : ${labels}`,
    palette: history,
    source: "fallback",
  };
}
