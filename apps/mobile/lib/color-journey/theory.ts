import i18n from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/localize";
import { hexToColorLabel } from "@/lib/color-names";
import { hexToRgb, rgbToHex } from "@/lib/nuance-finder/colors";
import { COLOR_JOURNEY_TURN_COUNT, getDimensionForTurn } from "./dimensions";
import {
  getSecondariesForPrimary,
  inferPrimaryFromHue,
  mixSecondaryHex,
  mixTertiaryHex,
  paintLabel,
  RYB_PRIMARIES,
  RYB_SECONDARIES,
  tertiaryLabel,
  type PaintPrimaryId,
  type PaintSecondaryId,
} from "./painting-theory";
import type {
  ColorChoice,
  ColorProposal,
  JourneyReflection,
  JourneySynthesis,
} from "./types";

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

export function hexFromHue(
  hue: number,
  preset: LightnessPreset = "moyen"
): string {
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

function lightnessPresetLabel(preset: LightnessPreset): string {
  if (preset === "clair") return i18n.t("amorces:colorJourney.lightnessLight");
  if (preset === "profond") return i18n.t("amorces:colorJourney.lightnessDeep");
  return i18n.t("amorces:colorJourney.lightnessMedium");
}

export interface TurnGuidance {
  title: string;
  subtitle: string;
  theory: string;
  highlightHues: number[];
  highlightSpread: number;
}

export function getTurnGuidance(
  turn: number,
  history: ColorChoice[]
): TurnGuidance {
  const dim = getDimensionForTurn(turn);

  if (turn === 1) {
    return {
      title: dim.title,
      subtitle: i18n.t("amorces:colorJourney.guidance.primarySubtitle"),
      theory: i18n.t("amorces:colorJourney.guidance.primaryTheory"),
      highlightHues: RYB_PRIMARIES.map((p) => p.hue),
      highlightSpread: 22,
    };
  }

  const primaryId = resolvePrimaryId(history);
  const primary = RYB_PRIMARIES.find((p) => p.id === primaryId)!;
  const primaryName = paintLabel(primary).toLowerCase();

  if (turn === 2) {
    const secondaries = getSecondariesForPrimary(primaryId);
    return {
      title: dim.title,
      subtitle: i18n.t("amorces:colorJourney.guidance.secondarySubtitle", {
        primary: primaryName,
      }),
      theory: i18n.t("amorces:colorJourney.guidance.secondaryTheory", {
        primary: primaryName,
        options: secondaries
          .map((s) => paintLabel(s).toLowerCase())
          .join(` ${i18n.t("amorces:colorJourney.guidance.or")} `),
      }),
      highlightHues: secondaries.map((s) => hexToHsl(mixSecondaryHex(s)).h),
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
    subtitle: i18n.t("amorces:colorJourney.guidance.tertiarySubtitle"),
    theory: i18n.t("amorces:colorJourney.guidance.tertiaryTheory"),
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
      label: paintLabel(p),
      hint: i18n.t("amorces:colorJourney.proposals.primaryHint"),
      paintId: p.id,
    }));
  }

  if (turn === 2) {
    const primaryId = resolvePrimaryId(history);
    return getSecondariesForPrimary(primaryId).map((secondary) => ({
      hex: mixSecondaryHex(secondary),
      label: paintLabel(secondary),
      hint: pickLocalized(secondary.recipe.parts),
      mixRecipe: pickLocalized(secondary.recipe.description),
      paintId: secondary.id,
    }));
  }

  if (turn === 3 && history.length >= 2) {
    const primaryId = resolvePrimaryId(history);
    const secondaryId = resolveSecondaryId(history);
    if (!secondaryId) return [];

    const secondaryDef = RYB_SECONDARIES.find((s) => s.id === secondaryId)!;
    const primaryName = paintLabel(
      RYB_PRIMARIES.find((p) => p.id === primaryId)!
    ).toLowerCase();
    const secondaryName = paintLabel(secondaryDef).toLowerCase();

    return (["primary", "secondary"] as const).map((bias) => {
      const hex = mixTertiaryHex(primaryId, secondaryId, bias);
      const label = tertiaryLabel(primaryId, secondaryId, bias);
      return {
        hex,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        hint:
          bias === "primary"
            ? i18n.t("amorces:colorJourney.proposals.tertiaryNearPrimary", {
                color: primaryName,
              })
            : i18n.t("amorces:colorJourney.proposals.tertiaryNearSecondary", {
                color: secondaryName,
              }),
        mixRecipe: i18n.t("amorces:colorJourney.proposals.tertiaryMix", {
          primary: primaryName,
          secondary: secondaryName,
          bias:
            bias === "primary"
              ? i18n.t("amorces:colorJourney.proposals.biasPrimary")
              : i18n.t("amorces:colorJourney.proposals.biasSecondary"),
        }),
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
    hint: i18n.t("amorces:colorJourney.proposals.wheelHint", {
      label: label.toLowerCase(),
      preset: lightnessPresetLabel(preset),
    }),
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
      hint: i18n.t("amorces:colorJourney.proposals.nearPrimary", {
        color: paintLabel(primary).toLowerCase(),
      }),
      paintId,
    };
  }

  if (turn === 2) {
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
    hint:
      closest?.hint ??
      i18n.t("amorces:colorJourney.proposals.tertiaryFallback"),
    mixRecipe: closest?.mixRecipe,
    paintId: closest?.paintId ?? "tertiary-custom",
  };
}

export function buildReflection(
  turn: number,
  chosen: ColorProposal,
  history: ColorChoice[]
): JourneyReflection {
  const guidance = getTurnGuidance(turn, history);
  const tipKey =
    turn === 1 || turn === 2 || turn === 3 ? String(turn) : "3";
  const practical = i18n.t(`amorces:colorJourney.tips.${tipKey}`);
  const question =
    turn <= COLOR_JOURNEY_TURN_COUNT
      ? i18n.t(`amorces:colorJourney.questions.${tipKey}`)
      : undefined;

  return {
    reflection: i18n.t("amorces:colorJourney.reflection", {
      label: chosen.label,
      practical: practical.toLowerCase(),
    }),
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
      ? i18n.t("amorces:colorJourney.synthesis.full")
      : history.length >= 2
        ? i18n.t("amorces:colorJourney.synthesis.partial")
        : i18n.t("amorces:colorJourney.synthesis.single");

  return {
    summary: i18n.t("amorces:colorJourney.synthesis.summary", {
      relations,
      labels,
    }),
    suggestedImpulse: labels
      ? i18n.t("amorces:colorJourney.synthesis.impulse", { labels })
      : i18n.t("amorces:colorJourney.synthesis.impulseEmpty"),
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
    return i18n.t("amorces:colorJourney.usageLine", {
      role,
      ratio,
      label: choice.label,
      hex: choice.hex,
      recipe,
    });
  });
  return lines.join("\n");
}
