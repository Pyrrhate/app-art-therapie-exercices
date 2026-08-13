import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Shell HTML statique Expo (SSR / premier paint).
 * Langue produit par défaut : FR (DEFAULT_LANGUAGE).
 * Le toggle in-app met à jour `document.documentElement.lang` via syncDocumentLanguage ;
 * le contenu de l'app suit i18n — ce shell SEO reste FR.
 */
const DEFAULT_TITLE =
  "Pastek Art — Libérez Votre Créativité / Unleash Your Creativity | pastek-art.eu";

const DEFAULT_DESCRIPTION =
  "Exercices créatifs guidés (dessin, peinture, collage) · Guided creative exercises. Coach local & BYOK — sans mur de connexion / no login wall.";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <title>{DEFAULT_TITLE}</title>
        <ScrollViewStyleReset />
      </head>
      <body style={{ height: "100%", margin: 0, backgroundColor: "#FAF7F4" }}>
        {children}
      </body>
    </html>
  );
}
