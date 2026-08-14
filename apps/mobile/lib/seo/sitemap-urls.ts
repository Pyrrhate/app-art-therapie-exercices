/** URLs publiques indexables — source unique pour sitemap.xml */
export const SITEMAP_BASE = "https://pastek-art.eu";

export const SITEMAP_PATHS: readonly string[] = [
  "/",
  "/exemples",
  "/fonctionnalites",
  "/glossaire",
  "/exemples/exemple-004",
  "/exemples/exemple-002",
  "/exemples/exemple-001",
  "/app",
  "/maj",
  "/app/privacy",
];

export function buildSitemapXml(baseUrl: string = SITEMAP_BASE): string {
  const urls = SITEMAP_PATHS.map((path) => {
    const loc = path === "/" ? `${baseUrl}/` : `${baseUrl}${path}`;
    return `  <url><loc>${loc}</loc></url>`;
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}
