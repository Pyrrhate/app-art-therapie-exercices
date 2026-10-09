import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

/**
 * Shell HTML racine (rendu static).
 * Les pages marketing ajoutent title/description/OG via expo-router/head.
 * On garde ici uniquement le socle commun pour éviter les doublons.
 */
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
        <meta name="application-name" content={SITE_NAME} />
        <link rel="sitemap" type="application/xml" href={`${SITE_URL}/sitemap.xml`} />
        <ScrollViewStyleReset />
      </head>
      <body style={{ height: "100%", margin: 0, backgroundColor: "#FAF7F4" }}>
        {children}
      </body>
    </html>
  );
}
