import { hexToColorLabel } from "@/lib/color-names";
import { hexToRgb, rgbToHex } from "@/lib/nuance-finder/colors";
import { COLOR_JOURNEY_TURN_COUNT, getDimensionForTurn } from "./dimensions";
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
  let g = 0;
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

export function analogousHues(hue: number, spread = 30): [number, number] {
  return [(hue - spread + 360) % 360, (hue + spread) % 360];
}

export function splitComplementaryHues(hue: number): [number, number] {
  const complement = complementaryHue(hue);
  return [(complement - 30 + 360) % 360, (complement + 30) % 360];
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
      subtitle:
        "Choisissez librement une teinte — votre point d'ancrage émotionnel sur la roue.",
      theory:
        "En psychologie des couleurs, le premier choix révèle souvent l'état intérieur du moment : chaleur, retrait, énergie ou douceur.",
      highlightHues: [],
      highlightSpread: 0,
    };
  }

  const anchor = hexToHsl(history[0]!.hex);
  const complement = complementaryHue(anchor.h);

  if (turn === 2) {
    return {
      title: dim.title,
      subtitle: "Teinte opposée (~180°) — le contraste complémentaire réveille la palette.",
      theory: `Face à ${history[0]!.label}, la complémentaire crée une vibration visuelle : l'œil perçoit d'abord la relation entre les deux pôles.`,
      highlightHues: [complement],
      highlightSpread: 26,
    };
  }

  if (turn === 3) {
    const second = history[1] ? hexToHsl(history[1].hex) : anchor;
    const third = pickTriadicHue(anchor.h, second.h);
    const warmHue = anchor.h < 180 ? anchor.h : complementaryHue(anchor.h);
    const coolHue = complementaryHue(warmHue);

    return {
      title: dim.title,
      subtitle: "Triade ou équilibre chaud/froid — la palette se referme.",
      theory: `La triade (${Math.round(third)}°) ou le contraste chaud/froid équilibre l'ensemble. Trois teintes forment un petit langage coloré unique.`,
      highlightHues: [third, warmHue, coolHue],
      highlightSpread: 20,
    };
  }

  return {
    title: dim.title,
    subtitle: "Choisissez une teinte pour refermer votre palette.",
    theory: "Chaque teinte modère ou amplifie les autres — un langage intérieur prêt pour l'exercice.",
    highlightHues: [anchor.h],
    highlightSpread: 18,
  };
}

export function getTurnProposals(
  turn: number,
  history: ColorChoice[],
  preset: LightnessPreset = "moyen"
): ColorProposal[] {
  if (turn === 1) return [];

  const guidance = getTurnGuidance(turn, history);
  const hues = guidance.highlightHues.slice(0, 3);

  return hues.map((hue, index) => {
    const hex = hexFromHue(hue, preset);
    const label = hexToColorLabel(hex);
    const dim = getDimensionForTurn(turn);
    return {
      hex,
      label,
      hint: `${dim.theoryLabel} · option ${index + 1}`,
    };
  });
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

const BODY_QUESTIONS = [
  "Où sentez-vous cette couleur dans votre corps ou votre humeur ?",
  "Si cette teinte était un geste, serait-il lent ou vif ?",
  "Quel souvenir ou quelle sensation cette couleur évoque-t-elle, même vaguement ?",
  "Cette teinte vous attire ou vous repousse — que cela dit-il de votre moment présent ?",
];

const PSYCHOLOGY_BY_TURN: Record<number, string> = {
  1: "Le premier choix chromatique oriente l'atmosphère de la création — accueillez-le comme un point de départ, pas une étiquette.",
  2: "La complémentaire réveille : elle peut exprimer un élan, une contradiction intérieure ou une envie de contraste.",
  3: "Votre palette devient un système : chaque teinte modère ou amplifie les autres — un langage intérieur prêt pour l'exercice.",
};

export function buildReflection(
  turn: number,
  chosen: ColorProposal,
  history: ColorChoice[]
): JourneyReflection {
  const guidance = getTurnGuidance(turn, history);
  const psychology = PSYCHOLOGY_BY_TURN[turn] ?? PSYCHOLOGY_BY_TURN[3]!;
  const question =
    turn < COLOR_JOURNEY_TURN_COUNT
      ? BODY_QUESTIONS[(turn + history.length) % BODY_QUESTIONS.length]
      : undefined;

  return {
    reflection: `${chosen.label} rejoint votre palette — laissez cette teinte résonner un instant.`,
    psychology,
    theory: guidance.theory,
    question,
    turn,
    chosen,
  };
}

export function buildSynthesis(history: ColorChoice[]): JourneySynthesis {
  const labels = history.map((h) => h.label).join(", ");
  const relations =
    history.length >= COLOR_JOURNEY_TURN_COUNT
      ? "Ancrage, complémentaire et équilibre tissent une palette personnelle."
      : history.length >= 2
        ? "Deux teintes suffisent pour une impulsion — vous pouvez continuer ou passer à l'exercice."
        : "Une première teinte pose l'ancrage — poursuivez ou passez à l'exercice.";

  return {
    summary: `${relations} Votre palette : ${labels}.`,
    suggestedImpulse: `Palette intérieure : ${labels}`,
    palette: history,
    source: "fallback",
  };
}
