import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { AppLanguage } from "./types";

import frCommon from "@/locales/fr/common.json";
import frLanding from "@/locales/fr/landing.json";
import frApp from "@/locales/fr/app.json";
import enCommon from "@/locales/en/common.json";
import enLanding from "@/locales/en/landing.json";
import enApp from "@/locales/en/app.json";

export const DEFAULT_LANGUAGE: AppLanguage = "fr";

const resources = {
  fr: {
    common: frCommon,
    landing: frLanding,
    app: frApp,
  },
  en: {
    common: enCommon,
    landing: enLanding,
    app: enApp,
  },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "common",
    ns: ["common", "landing", "app"],
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
    react: { useSuspense: false },
  });
}

export default i18n;
