/**
 * Chemins IA éligibles au BYOK (clé dans le corps JSON `byok`).
 * Les headers X-Custom-AI-* sont volontairement abandonnés côté client :
 * ils déclenchent un preflight CORS souvent refusé en production.
 */
export const BYOK_PROVIDER_HEADER = "X-Custom-AI-Provider";
export const BYOK_KEY_HEADER = "X-Custom-AI-Key";

export const BYOK_ENABLED_PATHS = [
  "/api/exercise/generate",
  "/api/ai/generate",
  "/api/reflection/analyze",
  "/api/reflection/ocr",
  "/api/ping-pong",
  "/api/color-journey/mirror",
  "/api/nuances/mirror",
] as const;

export function isByokEnabledPath(path: string): boolean {
  const normalized = path.split("?")[0] ?? path;
  return (BYOK_ENABLED_PATHS as readonly string[]).includes(normalized);
}
