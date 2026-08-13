import { Platform } from "react-native";
import Head from "expo-router/head";
import { useTranslation } from "react-i18next";
import { FeaturesPage } from "@/components/features/FeaturesPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import { FEATURES_CANONICAL } from "@/lib/features/copy";
import { ROUTES } from "@/lib/routes";

export default function FeaturesScreen() {
  const { t, i18n } = useTranslation("features");

  const page = (
    <ExamplesShell
      activeHref={ROUTES.features}
      breadcrumb={[
        { label: t("breadcrumb.home"), href: ROUTES.landing },
        { label: t("breadcrumb.features"), href: ROUTES.features },
      ]}
    >
      <FeaturesPage />
    </ExamplesShell>
  );

  if (Platform.OS !== "web") {
    return page;
  }

  const title = t("seo.title");
  const description = t("seo.description");

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
        <link rel="canonical" href={FEATURES_CANONICAL} />
      </Head>
      {page}
    </>
  );
}
