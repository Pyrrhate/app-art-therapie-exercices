/**
 * Headers HTTP pour le relay BYOK.
 * Les clés transitent uniquement le temps de la requête — jamais loguées.
 */
export const BYOK_PROVIDER_HEADER = "X-Custom-AI-Provider";
export const BYOK_KEY_HEADER = "X-Custom-AI-Key";

/** Endpoints qui peuvent utiliser une clé personnelle (relay IA). */
export const BYOK_ENABLED_PATHS = [
  "/api/exercise/generate",
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
