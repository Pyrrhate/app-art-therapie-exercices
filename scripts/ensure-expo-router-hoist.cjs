/**
 * @expo/cli (hoisté à la racine) require("expo-router/build/matchers")
 * pendant l'export static. Si expo-router n'est pas à la racine (npm workspaces),
 * on crée un lien symbolique / junction.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "apps", "mobile", "node_modules", "expo-router");
const link = path.join(root, "node_modules", "expo-router");

if (!fs.existsSync(target)) {
  console.warn("[ensure-expo-router] apps/mobile/node_modules/expo-router introuvable — skip.");
  process.exit(0);
}

const matchers = path.join(target, "build", "matchers.js");
if (!fs.existsSync(matchers)) {
  console.warn("[ensure-expo-router] matchers.js manquant — skip.");
  process.exit(0);
}

try {
  if (fs.existsSync(link)) {
    const resolved = fs.realpathSync(link);
    if (resolved === fs.realpathSync(target)) {
      console.log("[ensure-expo-router] déjà lié →", link);
      process.exit(0);
    }
    // Package réel à la racine : OK si matchers présents
    if (fs.existsSync(path.join(link, "build", "matchers.js"))) {
      console.log("[ensure-expo-router] déjà présent à la racine.");
      process.exit(0);
    }
  }
} catch {
  // continue
}

fs.mkdirSync(path.dirname(link), { recursive: true });
try {
  if (fs.existsSync(link) || fs.lstatSync(link).isSymbolicLink()) {
    fs.rmSync(link, { recursive: true, force: true });
  }
} catch {
  // ignore
}

const type = process.platform === "win32" ? "junction" : "dir";
fs.symlinkSync(target, link, type);
console.log("[ensure-expo-router] lien créé:", link, "→", target);
