import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import { router } from "expo-router";
import { ExamplesIndexPage } from "@/components/examples/ExamplesIndexPage";
import { ExamplesShell } from "@/components/examples/ExamplesShell";
import { PASTEK_EXAMPLES } from "@/lib/examples/catalog";
import { ROUTES } from "@/lib/routes";

const SEO_TITLE =
  "Exemples d'exercices d'art-thérapie — parcours peinture, écriture, créativité | Pastek Art";

const SEO_DESCRIPTION =
  "Découvrez des exemples concrets du générateur Pastek Art : impulsion, consigne IA, création guidée et réflexion bienveillante. Inspirez-vous avant votre premier rituel créatif.";

const CANONICAL = "https://pastek-art.eu/exemples";

export default function ExamplesIndexScreen() {
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
        <link rel="canonical" href={CANONICAL} />
      </Head>
      <ExamplesShell>
        <ExamplesIndexPage examples={PASTEK_EXAMPLES} />
      </ExamplesShell>
    </>
  );
}
