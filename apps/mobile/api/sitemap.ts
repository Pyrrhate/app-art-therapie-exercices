import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSitemapXml } from "@/lib/seo/sitemap-urls";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.status(200).send(buildSitemapXml());
}
