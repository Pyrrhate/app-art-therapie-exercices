import { hexToColorLabel } from "@/lib/color-names";
import { hexToRgb, rgbToHex } from "@/lib/nuance-finder/colors";
import { COLOR_JOURNEY_TURN_COUNT, getDimensionForTurn } from "./dimensions";
import {
  getSecondariesForPrimary,
  inferPrimaryFromHue,
  mixSecondaryHex,
  mixTertiaryHex,
  RYB_PRIMARIES,
  tertiaryLabel,
  type PaintPrimaryId,
  type PaintSecondaryId,
} from "./painting-theory";
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

export function inferPrimaryFromHex(hex: string): PaintPrimaryId {
  const normalized = hex.toUpperCase();
  const match = RYB_PRIMARIES.find((p) => p.hex.toUpperCase() === normalized);
  if (match) return match.id as PaintPrimaryId;
  return inferPrimaryFromHue(hexToHsl(hex).h);
}

function resolvePrimaryId(history: ColorChoice[]): PaintPrimaryId {
  const first = history[0];
  if (first?.paintId && ["red", "yellow", "blue"].includes(first.paintId)) {
    return first.paintId as PaintPrimaryId;
  }
  return first ? inferPrimaryFromHex(first.hex) : "red";
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function resolveSecondaryId(history: ColorChoice[]): PaintSecondaryId | null {
  const second = history[1];
  if (
    second?.paintId &&
    ["orange", "green", "violet"].includes(second.paintId)
  ) {
    return second.paintId as PaintSecondaryId;
  }
  if (!second) return null;
  const primaryId = resolvePrimaryId(history);
  const candidates = getSecondariesForPrimary(primaryId);
  const hsl = hexToHsl(second.hex);
  let best = candidates[0]!;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    const dist = hueDistance(hsl.h, hexToHsl(mixSecondaryHex(candidate)).h);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best.id;
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
        "Choisissez votre couleur primaire dominante — rouge, jaune ou bleu. C'est la base de votre palette peinture.",
      theory:
        "En peinture (modèle RYB), les trois primaires ne se mélangent pas entre elles : elles servent de point de départ pour créer toutes les autres teintes.",
      highlightHues: RYB_PRIMARIES.map((p) => p.hue),
      highlightSpread: 22,
    };
  }

  const primaryId = resolvePrimaryId(history);
  const primary = RYB_PRIMARIES.find((p) => p.id === primaryId)!;

  if (turn === 2) {
    const secondaries = getSecondariesForPrimary(primaryId);
    return {
      title: dim.title,
      subtitle: `Mélangez deux primaires pour obtenir une secondaire complémentaire à votre ${primary.label.toLowerCase()}.`,
      theory: `Les secondaires (orange, vert, violet) naissent du mélange de deux primaires. Face au ${primary.label.toLowerCase()}, choisissez ${secondaries.map((s) => s.label.toLowerCase()).join(" ou ")}.`,
      highlightHues: secondaries.map((s) => {
        const hex = mixSecondaryHex(s);
        return hexToHsl(hex).h;
      }),
      highlightSpread: 24,
    };
  }

  const secondaryId = resolveSecondaryId(history);
  const highlights: number[] = [primary.hue];
  if (secondaryId) {
    highlights.push(
      hexToHsl(mixTertiaryHex(primaryId, secondaryId, "primary")).h,
      hexToHsl(mixTertiaryHex(primaryId, secondaryId, "secondary")).h
    );
  }

  return {
    title: dim.title,
    subtitle:
      "Une teinte tertiaire entre votre primaire et secondaire — idéale pour ombres, accents et transitions.",
    theory:
      "Les tertiaires (rouge-orange, jaune-vert, bleu-violet…) enrichissent la palette sans la surcharger. Pensez ratio 60 % primaire · 30 % secondaire · 10 % tertiaire.",
    highlightHues: highlights,
    highlightSpread: 18,
  };
}

export function getTurnProposals(
  turn: number,
  history: ColorChoice[],
  _preset: LightnessPreset = "moyen"
): ColorProposal[] {
  if (turn === 1) {
    return RYB_PRIMARIES.map((p) => ({
      hex: p.hex,
      label: p.label,
      hint: "Primaire RYB — teinte pure",
      paintId: p.id,
    }));
  }

  if (turn === 2) {
    const primaryId = resolvePrimaryId(history);
    return getSecondariesForPrimary(primaryId).map((secondary) => ({
      hex: mixSecondaryHex(secondary),
      label: secondary.label,
      hint: secondary.recipe.parts,
      mixRecipe: secondary.recipe.description,
      paintId: secondary.id,
    }));
  }

  if (turn === 3 && history.length >= 2) {
    const primaryId = resolvePrimaryId(history);
    const secondaryId = resolveSecondaryId(history);
    if (!secondaryId) return [];

    return (["primary", "secondary"] as const).map((bias) => {
      const hex = mixTertiaryHex(primaryId, secondaryId, bias);
      const label = tertiaryLabel(primaryId, secondaryId, bias);
      const primaryLabel =
        RYB_PRIMARIES.find((p) => p.id === primaryId)!.label.toLowerCase();
      const secondaryLabel = secondaryId;
      return {
        hex,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        hint:
          bias === "primary"
            ? `Proche du ${primaryLabel} — ombres et profondeur`
            : `Proche du ${secondaryLabel} — accents et lumières`,
        mixRecipe: `Mélange ${primaryLabel} + ${secondaryLabel} (${bias === "primary" ? "dominante primaire" : "dominante secondaire"})`,
        paintId: `tertiary-${bias}`,
      };
    });
  }

  return [];
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

export function buildProposalFromWheel(
  turn: number,
  hex: string,
  history: ColorChoice[]
): ColorProposal {
  const label = hexToColorLabel(hex);

  if (turn === 1) {
    const paintId = inferPrimaryFromHex(hex);
    const primary = RYB_PRIMARIES.find((p) => p.id === paintId)!;
    return {
      hex,
      label,
      hint: `Proche du ${primary.label.toLowerCase()} — primaire RYB`,
      paintId,
    };
  }

  if (turn === 2) {
    const primaryId = resolvePrimaryId(history);
    const proposals = getTurnProposals(2, history);
    const hsl = hexToHsl(hex);
    let closest = proposals[0]!;
    let bestDist = Infinity;
    for (const p of proposals) {
      const dist = hueDistance(hsl.h, hexToHsl(p.hex).h);
      if (dist < bestDist) {
        bestDist = dist;
        closest = p;
      }
    }
    return {
      hex,
      label,
      hint: closest.hint,
      mixRecipe: closest.mixRecipe,
      paintId: closest.paintId,
    };
  }

  const proposals = getTurnProposals(3, history);
  const closest = proposals[0];
  return {
    hex,
    label,
    hint: closest?.hint ?? "Tertiaire — nuance d'accord",
    mixRecipe: closest?.mixRecipe,
    paintId: closest?.paintId ?? "tertiary-custom",
  };
}

const PAINTING_TIPS: Record<number, string> = {
  1: "Utilisez cette primaire pour les grandes masses (~60 % de la surface).",
  2: "La secondaire équilibre la primaire — réservée aux zones médianes (~30 %).",
  3: "La tertiaire sert aux accents, contours et détails (~10 %).",
};

const PRACTICAL_QUESTIONS: Record<number, string> = {
  1: "Testez la teinte sur une bande d'essai avant de couvrir la toile.",
  2: "Mélangez sur la palette avec un couteau — pas directement sur le papier.",
  3: "Un peu de blanc adoucit la tertiaire sans la désaturer entièrement.",
};

export function buildReflection(
  turn: number,
  chosen: ColorProposal,
  history: ColorChoice[]
): JourneyReflection {
  const guidance = getTurnGuidance(turn, history);
  const practical = PAINTING_TIPS[turn] ?? PAINTING_TIPS[3]!;
  const question =
    turn <= COLOR_JOURNEY_TURN_COUNT
      ? PRACTICAL_QUESTIONS[turn]
      : undefined;

  return {
    reflection: `${chosen.label} rejoint votre palette — ${practical.toLowerCase()}`,
    psychology: practical,
    theory: guidance.theory,
    question,
    mixRecipe: chosen.mixRecipe ?? chosen.hint,
    turn,
    chosen,
  };
}

export function buildSynthesis(history: ColorChoice[]): JourneySynthesis {
  const labels = history.map((h) => h.label).join(", ");

  const relations =
    history.length >= COLOR_JOURNEY_TURN_COUNT
      ? `Primaire, secondaire et tertiaire forment une palette peinture équilibrée (ratio 60·30·10).`
      : history.length >= 2
        ? "Primaire et secondaire suffisent pour démarrer — vous pouvez ajouter une tertiaire ou passer à l'exercice."
        : "Une primaire pose la base — poursuivez pour construire votre palette.";

  return {
    summary: `${relations} Votre palette : ${labels}.`,
    suggestedImpulse: `Palette peinture : ${labels}`,
    palette: history,
    source: "fallback",
  };
}

export function buildPaletteUsageGuide(history: ColorChoice[]): string {
  if (history.length === 0) return "";
  const lines = history.map((choice, index) => {
    const role = getDimensionForTurn(index + 1).title;
    const ratio = index === 0 ? "60 %" : index === 1 ? "30 %" : "10 %";
    const recipe = choice.mixRecipe ? ` · ${choice.mixRecipe}` : "";
    return `${role} (${ratio}) : ${choice.label} (${choice.hex})${recipe}`;
  });
  return lines.join("\n");
}
