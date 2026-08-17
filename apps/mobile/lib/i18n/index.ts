import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { AppLanguage } from "./types";

import frCommon from "@/locales/fr/common.json";
import frLanding from "@/locales/fr/landing.json";
import frApp from "@/locales/fr/app.json";
import frFil from "@/locales/fr/fil.json";
import frSeasons from "@/locales/fr/seasons.json";
import frFeatures from "@/locales/fr/features.json";
import frGlossary from "@/locales/fr/glossary.json";
import frRitual from "@/locales/fr/ritual.json";
import frAmorces from "@/locales/fr/amorces.json";
import frLegal from "@/locales/fr/legal.json";
import frJournal from "@/locales/fr/journal.json";
import enCommon from "@/locales/en/common.json";
import enLanding from "@/locales/en/landing.json";
import enApp from "@/locales/en/app.json";
import enFil from "@/locales/en/fil.json";
import enSeasons from "@/locales/en/seasons.json";
import enFeatures from "@/locales/en/features.json";
import enGlossary from "@/locales/en/glossary.json";
import enRitual from "@/locales/en/ritual.json";
import enAmorces from "@/locales/en/amorces.json";
import enLegal from "@/locales/en/legal.json";
import enJournal from "@/locales/en/journal.json";

export const DEFAULT_LANGUAGE: AppLanguage = "fr";

const resources = {
  fr: {
    common: frCommon,
    landing: frLanding,
    app: frApp,
    fil: frFil,
    seasons: frSeasons,
    features: frFeatures,
    glossary: frGlossary,
    ritual: frRitual,
    amorces: frAmorces,
    legal: frLegal,
    examples: frExamples,
    journal: frJournal,
  },
  en: {
    common: enCommon,
    landing: enLanding,
    app: enApp,
    fil: enFil,
    seasons: enSeasons,
    features: enFeatures,
    glossary: enGlossary,
    ritual: enRitual,
    amorces: enAmorces,
    legal: enLegal,
    examples: enExamples,
    journal: enJournal,
  },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "common",
    ns: [
      "common",
      "landing",
      "app",
      "fil",
      "seasons",
      "features",
      "glossary",
      "ritual",
      "amorces",
      "legal",
      "examples",
      "journal",
    ],
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
    react: { useSuspense: false },
  });
}

export default i18n;
