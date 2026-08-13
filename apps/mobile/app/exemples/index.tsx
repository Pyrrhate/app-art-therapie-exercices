import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ExamplesIndexPage } from "@/components/examples/ExamplesIndexPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import { getExamples } from "@/lib/examples/catalog";
import { useLanguageStore } from "@/lib/i18n/languageStore";
import { ROUTES } from "@/lib/routes";

const CANONICAL = "https://pastek-art.eu/exemples";

export default function ExamplesIndexScreen() {
  const { t } = useTranslation("examples");
  const language = useLanguageStore((s) => s.language);
  const examples = getExamples(language);

  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace(ROUTES.home);
    }
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  const seoTitle = t("index.seoTitle");
  const seoDescription = t("index.seoDescription");

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={CANONICAL} />
      </Head>
      <ExamplesShell>
        <ExamplesIndexPage examples={examples} />
      </ExamplesShell>
    </>
  );
}
