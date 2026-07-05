import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSitemapXml, ROBOTS_TXT } from "./sitemap-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");

if (!fs.existsSync(distDir)) {
  console.error("[copy-public] dist/ introuvable — lancez expo export d'abord.");
  process.exit(1);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), buildSitemapXml(), "utf8");
fs.writeFileSync(path.join(publicDir, "robots.txt"), ROBOTS_TXT, "utf8");

for (const name of fs.readdirSync(publicDir)) {
  fs.cpSync(path.join(publicDir, name), path.join(distDir, name), { recursive: true });
  console.log(`[copy-public] ${name} → dist/`);
}
