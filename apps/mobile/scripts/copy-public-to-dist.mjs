import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");

if (!fs.existsSync(publicDir)) {
  console.warn("[copy-public] dossier public/ absent, rien à copier.");
  process.exit(0);
}

if (!fs.existsSync(distDir)) {
  console.error("[copy-public] dist/ introuvable — lancez expo export d'abord.");
  process.exit(1);
}

for (const name of fs.readdirSync(publicDir)) {
  fs.cpSync(path.join(publicDir, name), path.join(distDir, name), { recursive: true });
  console.log(`[copy-public] ${name} → dist/`);
}
