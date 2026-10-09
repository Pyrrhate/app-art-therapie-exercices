/**
 * Injecte les balises SEO dans dist/index.html (mode web.output=single).
 * Les crawlers qui ne font pas tourner le JS voient ainsi title/description/OG/JSON-LD.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "dist", "index.html");

const SITE_URL = "https://pastek-art.eu";
const SITE_NAME = "Pastek Art";
const TITLE =
  "Pastek Art — Libérez Votre Créativité, Un Exercice à la Fois | pastek-art.eu";
const DESCRIPTION =
  "Générateur d'exercices créatifs guidés : dessin, peinture, collage. Coach créatif bienveillant, 100 % local & BYOK — sans mur de connexion ni jargon clinique.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: DESCRIPTION,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "fr",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  },
};

const headInjection = `
    <title>${TITLE}</title>
    <meta name="description" content="${DESCRIPTION}" />
    <meta name="robots" content="index, follow" />
    <meta name="application-name" content="${SITE_NAME}" />
    <link rel="canonical" href="${SITE_URL}/" />
    <link rel="sitemap" type="application/xml" href="${SITE_URL}/sitemap.xml" />
    <link rel="alternate" hrefLang="fr" href="${SITE_URL}/" />
    <link rel="alternate" hrefLang="x-default" href="${SITE_URL}/" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:alt" content="${SITE_NAME}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESCRIPTION}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
`.trim();

const noscriptBlock = `
    <noscript>
      <main style="font-family: Georgia, serif; max-width: 40rem; margin: 2rem auto; padding: 0 1.25rem; color: #2a241c; line-height: 1.6;">
        <h1>${TITLE.split(" | ")[0]}</h1>
        <p>${DESCRIPTION}</p>
        <p><a href="${SITE_URL}/exemples">Exemples</a> · <a href="${SITE_URL}/fonctionnalites">Fonctionnalités</a> · <a href="${SITE_URL}/glossaire">Glossaire</a> · <a href="${SITE_URL}/app">Espace créatif</a></p>
      </main>
    </noscript>
`.trim();

if (!fs.existsSync(indexPath)) {
  console.error("[inject-seo] dist/index.html introuvable.");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

html = html.replace(/<html\b[^>]*>/i, '<html lang="fr">');
html = html.replace(/<title>[\s\S]*?<\/title>/gi, "");
html = html.replace(
  /<meta\s+name=["']description["'][^>]*>/gi,
  ""
);
html = html.replace(
  /<script type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi,
  ""
);
html = html.replace(/<\/head>/i, `    ${headInjection}\n  </head>`);
html = html.replace(
  /<noscript>\s*You need to enable JavaScript to run this app\.\s*<\/noscript>/i,
  noscriptBlock
);

fs.writeFileSync(indexPath, html, "utf8");
console.log("[inject-seo] Métas SEO injectées dans dist/index.html");
