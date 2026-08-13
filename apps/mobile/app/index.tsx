import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { LandingPage } from "@/components/landing/LandingPage";
import { ROUTES } from "@/lib/routes";
import { useLanguageStore } from "@/lib/i18n/languageStore";

export default function MarketingHomeScreen() {
  const { t, i18n } = useTranslation("landing");
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace(ROUTES.home);
    }
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  const title = t("seo.title");
  const description = t("seo.description");

  return (
    <>
      <Head key={language}>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:locale" content={i18n.language === "en" ? "en_GB" : "fr_FR"} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pastek-art.eu/" />
        <link
          rel="sitemap"
          type="application/xml"
          href="https://pastek-art.eu/sitemap.xml"
        />
      </Head>
      <LandingPage />
    </>
  );
}
