import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { ExampleDetailPage } from "@/components/examples/ExampleDetailPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import { EXEMPLE_001 } from "@/lib/examples/catalog";
import { ROUTES } from "@/lib/routes";

const SITE = "https://pastek-art.eu";
const example = EXEMPLE_001;

export default function Exemple001Screen() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace(ROUTES.home);
    }
  }, []);

  if (Platform.OS !== "web") {
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
      "art-thérapie",
      "exercice de peinture",
      "lâcher-prise créatif",
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
          { label: "Accueil", href: ROUTES.landing },
          { label: "Exemples", href: ROUTES.examples },
          { label: example.title, href: ROUTES.example(example.slug) },
        ]}
      >
        <ExampleDetailPage example={example} />
      </ExamplesShell>
    </>
  );
}
