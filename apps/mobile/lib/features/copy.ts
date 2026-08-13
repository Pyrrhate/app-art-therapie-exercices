import type { TFunction } from "i18next";

export const FEATURES_CANONICAL = "https://pastek-art.eu/fonctionnalites";

/** `t` du namespace `features`. */
export type FeaturesTranslator = TFunction<"features">;

/** Ordre de lecture de la page — les textes vivent dans le namespace `features`. */
export const FEATURE_SECTION_IDS = [
  "atelier",
  "rituel",
  "fil",
  "saisons",
  "local",
  "sur-mesure",
] as const;

export type FeatureSectionId = (typeof FEATURE_SECTION_IDS)[number];

export type FeatureSection = {
  id: FeatureSectionId;
  kicker: string;
  title: string;
  paragraphs: string[];
};

export type FeaturesHero = {
  kicker: string;
  title: string;
  accent: string;
  lead: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is string => typeof p === "string");
}

export function getFeaturesHero(t: FeaturesTranslator): FeaturesHero {
  return {
    kicker: asText(t("hero.kicker")),
    title: asText(t("hero.title")),
    accent: asText(t("hero.accent")),
    lead: asText(t("hero.lead")),
  };
}

export function getFeatureSections(t: FeaturesTranslator): FeatureSection[] {
  return FEATURE_SECTION_IDS.map((id) => ({
    id,
    kicker: asText(t(`sections.${id}.kicker`)),
    title: asText(t(`sections.${id}.title`)),
    paragraphs: asParagraphs(
      t(`sections.${id}.paragraphs`, { returnObjects: true })
    ),
  }));
}
