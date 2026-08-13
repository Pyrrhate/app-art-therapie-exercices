import type { LocalizedText } from "@/lib/i18n/types";
import { pickLocalized } from "@/lib/i18n/localize";

/** Trois étapes — palette peinture RYB (primaire → secondaire → tertiaire). */
export const COLOR_JOURNEY_DIMENSIONS = [
  {
    id: "primary",
    title: {
      fr: "Couleur primaire",
      en: "Primary colour",
    } satisfies LocalizedText,
    shortTitle: { fr: "Primaire", en: "Primary" } satisfies LocalizedText,
    subtitle: {
      fr: "Votre teinte dominante — rouge, jaune ou bleu",
      en: "Your dominant hue — red, yellow or blue",
    } satisfies LocalizedText,
    theoryLabel: {
      fr: "Primaires RYB (peinture)",
      en: "RYB primaries (painting)",
    } satisfies LocalizedText,
  },
  {
    id: "secondary",
    title: {
      fr: "Couleur secondaire",
      en: "Secondary colour",
    } satisfies LocalizedText,
    shortTitle: { fr: "Secondaire", en: "Secondary" } satisfies LocalizedText,
    subtitle: {
      fr: "Obtenue en mélangeant deux primaires",
      en: "Made by mixing two primaries",
    } satisfies LocalizedText,
    theoryLabel: {
      fr: "Orange, vert ou violet",
      en: "Orange, green or violet",
    } satisfies LocalizedText,
  },
  {
    id: "tertiary",
    title: {
      fr: "Couleur tertiaire",
      en: "Tertiary colour",
    } satisfies LocalizedText,
    shortTitle: { fr: "Tertiaire", en: "Tertiary" } satisfies LocalizedText,
    subtitle: {
      fr: "Nuance d'accord entre votre primaire et secondaire",
      en: "A bridging shade between your primary and secondary",
    } satisfies LocalizedText,
    theoryLabel: {
      fr: "Tertiaires (ex. rouge-orange, bleu-vert)",
      en: "Tertiaries (e.g. red-orange, blue-green)",
    } satisfies LocalizedText,
  },
] as const;

export type ColorJourneyDimensionId =
  (typeof COLOR_JOURNEY_DIMENSIONS)[number]["id"];

export interface ColorJourneyDimension {
  id: ColorJourneyDimensionId;
  title: string;
  shortTitle: string;
  subtitle: string;
  theoryLabel: string;
}

export const COLOR_JOURNEY_TURN_COUNT = COLOR_JOURNEY_DIMENSIONS.length;

export function getDimensionForTurn(
  turn: number,
  language?: import("@/lib/i18n/types").AppLanguage
): ColorJourneyDimension {
  const index = Math.max(0, Math.min(turn - 1, COLOR_JOURNEY_TURN_COUNT - 1));
  const dim = COLOR_JOURNEY_DIMENSIONS[index]!;
  return {
    id: dim.id,
    title: pickLocalized(dim.title, language),
    shortTitle: pickLocalized(dim.shortTitle, language),
    subtitle: pickLocalized(dim.subtitle, language),
    theoryLabel: pickLocalized(dim.theoryLabel, language),
  };
}
