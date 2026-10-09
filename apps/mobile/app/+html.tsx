import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";
import {
  DEFAULT_SEO,
  OG_IMAGE_URL,
  SITE_NAME,
  SITE_URL,
  SITEMAP_URL,
} from "@/lib/seo/site";

/**
 * Shell HTML statique Expo (rendu static / premier paint).
 * Langue produit par défaut : FR.
 * Les pages marketing enrichissent encore via expo-router/head.
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
        <title>{DEFAULT_SEO.title}</title>
        <meta name="description" content={DEFAULT_SEO.description} />
        <meta name="robots" content="index, follow" />
        <meta name="application-name" content={SITE_NAME} />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <link rel="sitemap" type="application/xml" href={SITEMAP_URL} />

        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={DEFAULT_SEO.locale} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:title" content={DEFAULT_SEO.title} />
        <meta property="og:description" content={DEFAULT_SEO.description} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:alt" content={SITE_NAME} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DEFAULT_SEO.title} />
        <meta name="twitter:description" content={DEFAULT_SEO.description} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />

        <ScrollViewStyleReset />
      </head>
      <body style={{ height: "100%", margin: 0, backgroundColor: "#FAF7F4" }}>
        {children}
      </body>
    </html>
  );
}
