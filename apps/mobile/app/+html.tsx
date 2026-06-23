import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

const DEFAULT_TITLE =
  "Générateur d'Exercices d'Art-Thérapie & Rituels Créatifs | Lâcher-Prise";

const DEFAULT_DESCRIPTION =
  "Besoin de décompresser ou de libérer votre créativité ? Découvrez notre générateur gratuit d'exercices d'art-thérapie et de rituels de dessin pour retrouver le calme et le bien-être.";

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
