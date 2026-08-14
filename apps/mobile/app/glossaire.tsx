import { Platform } from "react-native";
import Head from "expo-router/head";
import { useTranslation } from "react-i18next";
import { GlossaryPage } from "@/components/glossary/GlossaryPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import {
  GLOSSARY_CANONICAL,
  getGlossaryTerms,
} from "@/lib/glossary/copy";
import { ROUTES } from "@/lib/routes";

export default function GlossaryScreen() {
  const { t, i18n } = useTranslation("glossary");
  const terms = getGlossaryTerms(t);

  const page = (
    <ExamplesShell
      activeHref={ROUTES.glossary}
      breadcrumb={[
        { label: t("breadcrumb.home"), href: ROUTES.landing },
        { label: t("breadcrumb.glossary"), href: ROUTES.glossary },
      ]}
    >
      <GlossaryPage />
    </ExamplesShell>
  );

  if (Platform.OS !== "web") {
    return page;
  }

  const title = t("seo.title");
  const description = t("seo.description");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: title,
    description,
    url: GLOSSARY_CANONICAL,
    inLanguage: i18n.language === "en" ? "en" : "fr",
    hasDefinedTerm: terms.map((entry) => ({
      "@type": "DefinedTerm",
      name: entry.term,
      description: entry.body,
      url: `${GLOSSARY_CANONICAL}#${entry.id}`,
    })),
  };

  return (
    <>
      <Head key={i18n.language}>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:locale"
          content={i18n.language === "en" ? "en_GB" : "fr_FR"}
        />
        <meta property="og:type" content="article" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={GLOSSARY_CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      {page}
    </>
  );
}
