import type { TFunction } from "i18next";

export const GLOSSARY_CANONICAL = "https://pastek-art.eu/glossaire";

/** `t` du namespace `glossary`. */
export type GlossaryTranslator = TFunction<"glossary">;

/**
 * 15 premiers termes — vocabulaire Pastek + créatif utile SEO.
 * Ordre de lecture sur la page.
 */
export const GLOSSARY_TERM_IDS = [
  "impulse",
  "amorce",
  "ritual",
  "brief",
  "mirror",
  "fil",
  "byok",
  "express",
  "deep",
  "season",
  "guided-exercise",
  "bespoke",
  "local-first",
  "letting-go",
  "creative-silence",
] as const;

export type GlossaryTermId = (typeof GLOSSARY_TERM_IDS)[number];

export type GlossaryTerm = {
  id: GlossaryTermId;
  term: string;
  body: string;
};

export type GlossaryHero = {
  kicker: string;
  title: string;
  accent: string;
  lead: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function getGlossaryHero(t: GlossaryTranslator): GlossaryHero {
  return {
    kicker: asText(t("hero.kicker")),
    title: asText(t("hero.title")),
    accent: asText(t("hero.accent")),
    lead: asText(t("hero.lead")),
  };
}

export function getGlossaryTerms(t: GlossaryTranslator): GlossaryTerm[] {
  return GLOSSARY_TERM_IDS.map((id) => ({
    id,
    term: asText(t(`terms.${id}.term`)),
    body: asText(t(`terms.${id}.body`)),
  }));
}
