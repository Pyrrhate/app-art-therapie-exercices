import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { LandingPage } from "@/components/landing/LandingPage";
import { ROUTES } from "@/lib/routes";
import { useLanguageStore } from "@/lib/i18n/languageStore";
import {
  OG_IMAGE_URL,
  SITE_NAME,
  SITE_URL,
  SITEMAP_URL,
  buildWebAppJsonLd,
} from "@/lib/seo/site";

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
  const locale = i18n.language === "en" ? "en_GB" : "fr_FR";
  const jsonLd = buildWebAppJsonLd({
    title,
    description,
    inLanguage: i18n.language === "en" ? "en" : "fr",
  });

  return (
    <>
      <Head key={language}>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <meta name="application-name" content={SITE_NAME} />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <link rel="sitemap" type="application/xml" href={SITEMAP_URL} />
        <link
          rel="alternate"
          hrefLang="fr"
          href={`${SITE_URL}/`}
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${SITE_URL}/`}
        />

        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={locale} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:alt" content={SITE_NAME} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <LandingPage />
    </>
  );
}
