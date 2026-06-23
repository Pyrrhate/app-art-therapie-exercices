import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { LandingPage } from "@/components/landing/LandingPage";
import { ROUTES } from "@/lib/routes";

const SEO_TITLE =
  "Générateur d'Exercices d'Art-Thérapie & Rituels Créatifs | Lâcher-Prise";

const SEO_DESCRIPTION =
  "Besoin de décompresser ou de libérer votre créativité ? Découvrez notre générateur gratuit d'exercices d'art-thérapie et de rituels de dessin pour retrouver le calme et le bien-être.";

export default function MarketingHomeScreen() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace(ROUTES.home);
    }
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <>
      <Head>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESCRIPTION} />
        <meta property="og:title" content={SEO_TITLE} />
        <meta property="og:description" content={SEO_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pastek-art.eu/" />
      </Head>
      <LandingPage />
    </>
  );
}
