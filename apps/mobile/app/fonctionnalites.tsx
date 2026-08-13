import { Platform } from "react-native";
import Head from "expo-router/head";
import { FeaturesPage } from "@/components/features/FeaturesPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import {
  FEATURES_CANONICAL,
  FEATURES_SEO_DESCRIPTION,
  FEATURES_SEO_TITLE,
} from "@/lib/features/copy";
import { ROUTES } from "@/lib/routes";

export default function FeaturesScreen() {
  const page = (
    <ExamplesShell
      activeHref={ROUTES.features}
      breadcrumb={[
        { label: "Accueil", href: ROUTES.landing },
        { label: "Fonctionnalités", href: ROUTES.features },
      ]}
    >
      <FeaturesPage />
    </ExamplesShell>
  );

  if (Platform.OS !== "web") {
    return page;
  }

  return (
    <>
      <Head>
        <title>{FEATURES_SEO_TITLE}</title>
        <meta name="description" content={FEATURES_SEO_DESCRIPTION} />
        <meta property="og:title" content={FEATURES_SEO_TITLE} />
        <meta property="og:description" content={FEATURES_SEO_DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={FEATURES_CANONICAL} />
      </Head>
      {page}
    </>
  );
}
