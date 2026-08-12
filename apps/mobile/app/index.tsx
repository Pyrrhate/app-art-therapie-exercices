import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { LandingPage } from "@/components/landing/LandingPage";
import { ROUTES } from "@/lib/routes";

const SEO_TITLE =
  "Pastek Art — Libérez Votre Créativité, Un Exercice à la Fois | pastek-art.eu";

const SEO_DESCRIPTION =
  "Générateur d'exercices créatifs guidés : dessin, peinture, collage. Coach créatif bienveillant, 100 % local & BYOK — sans mur de connexion ni jargon clinique.";

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
