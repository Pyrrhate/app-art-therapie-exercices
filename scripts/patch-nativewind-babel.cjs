/**
 * NativeWind 4.2+ pulls react-native-css-interop 0.2.x which expects
 * react-native-worklets (Reanimated 4). Expo SDK 52 uses Reanimated 3.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const candidates = [
  path.join(
    root,
    "node_modules/nativewind/node_modules/react-native-css-interop/babel.js",
  ),
  path.join(root, "node_modules/react-native-css-interop/babel.js"),
];

const from =
  /\/\/ Use this plugin in reanimated 4 and later\s*\n\s*"react-native-worklets\/plugin"/;
const to = '"react-native-reanimated/plugin"';

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("react-native-worklets/plugin")) continue;

  fs.writeFileSync(file, content.replace(from, to));
  console.log(`[patch-nativewind-babel] Corrigé : ${file}`);
}
