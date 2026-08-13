import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ExampleDetailPage } from "@/components/examples/ExampleDetailPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import { getExampleBySlug } from "@/lib/examples/catalog";
import { useLanguageStore } from "@/lib/i18n/languageStore";
import { ROUTES } from "@/lib/routes";

const SITE = "https://pastek-art.eu";
const SLUG = "exemple-004";

export default function Exemple004Screen() {
  const { t } = useTranslation("examples");
  const language = useLanguageStore((s) => s.language);
  const example = getExampleBySlug(SLUG, language);

  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace(ROUTES.home);
    }
  }, []);

  if (Platform.OS !== "web" || !example) {
    return null;
  }

  const canonical = `${SITE}${example.canonicalPath}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: example.title,
    description: example.seoDescription,
    datePublished: example.publishedAt,
    author: { "@type": "Organization", name: "Pastek Art" },
    publisher: { "@type": "Organization", name: "Pastek Art" },
    mainEntityOfPage: canonical,
    about: [
      t("jsonLd.about1"),
      t("jsonLd.about2"),
      t("jsonLd.about3Emotions"),
      example.technique,
    ],
  };

  return (
    <>
      <Head>
        <title>{example.seoTitle}</title>
        <meta name="description" content={example.seoDescription} />
        <meta property="og:title" content={example.seoTitle} />
        <meta property="og:description" content={example.seoDescription} />
        <meta property="og:type" content="article" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <ExamplesShell
        breadcrumb={[
          { label: t("breadcrumb.home"), href: ROUTES.landing },
          { label: t("breadcrumb.examples"), href: ROUTES.examples },
          { label: example.title, href: ROUTES.example(example.slug) },
        ]}
      >
        <ExampleDetailPage example={example} />
      </ExamplesShell>
    </>
  );
}
