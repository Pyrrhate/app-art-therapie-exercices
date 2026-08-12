import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

const DEFAULT_TITLE =
  "Pastek Art — Libérez Votre Créativité, Un Exercice à la Fois | pastek-art.eu";

const DEFAULT_DESCRIPTION =
  "Générateur d'exercices créatifs guidés : dessin, peinture, collage. Coach créatif bienveillant, 100 % local & BYOK — sans mur de connexion ni jargon clinique.";

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
