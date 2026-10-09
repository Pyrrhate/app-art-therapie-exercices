/** Constantes SEO partagées (shell HTML + pages marketing). */
export const SITE_URL = "https://pastek-art.eu";
export const SITE_NAME = "Pastek Art";
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
export const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

export const DEFAULT_SEO = {
  title:
    "Pastek Art — Libérez Votre Créativité, Un Exercice à la Fois | pastek-art.eu",
  description:
    "Générateur d'exercices créatifs guidés : dessin, peinture, collage. Coach créatif bienveillant, 100 % local & BYOK — sans mur de connexion ni jargon clinique.",
  locale: "fr_FR",
} as const;

export function buildWebAppJsonLd(input: {
  title: string;
  description: string;
  inLanguage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: input.description,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: input.inLanguage ?? "fr",
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
}
