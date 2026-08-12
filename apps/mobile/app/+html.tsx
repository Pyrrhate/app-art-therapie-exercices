import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

const DEFAULT_TITLE =
  "Générateur d'Exercices Créatifs & Rituels Artistiques | Pastek Art";

const DEFAULT_DESCRIPTION =
  "Besoin de décompresser ou de libérer votre créativité ? Découvrez notre générateur gratuit d'exercices créatifs et de rituels de dessin pour le lâcher-prise — sans prétendre remplacer un accompagnement professionnel.";

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
