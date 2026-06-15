import { router } from "expo-router";
import type { MandalaTheme } from "@/lib/mandala/types";
import { setMandalaCustomPalette } from "@/lib/mandala/customPalette";
import { useRitualStore } from "@/lib/store";
import type { ArtisticTechnique } from "@/lib/types";

export function startRitualFromImpulse(
  impulse: string,
  technique: ArtisticTechnique = "mixed_media"
): void {
  const store = useRitualStore.getState();
  store.reset();
  store.setImpulse(impulse.trim());
  store.setTechnique(technique);
  router.push("/ritual");
}

export function startRitualFromColors(
  colors: string[],
  label = "Nuancier"
): void {
  const unique = [...new Set(colors.filter(Boolean))].slice(0, 4);
  const impulse =
    unique.length > 0
      ? `${label} : ${unique.join(", ")}`
      : `${label} du moment`;
  startRitualFromImpulse(impulse, "painting");
}

export function openMandalaStudio(theme: MandalaTheme = "calm"): void {
  router.push({ pathname: "/mandala/studio", params: { theme } });
}

export async function openMandalaWithPalette(
  colors: string[],
  theme: MandalaTheme = "calm"
): Promise<void> {
  await setMandalaCustomPalette(colors);
  openMandalaStudio(theme);
}

export function extractDominantColors(
  fills: Record<string, string>,
  limit = 3
): string[] {
  const counts = new Map<string, number>();
  for (const hex of Object.values(fills)) {
    if (!hex || hex.toUpperCase() === "#FFFFFF" || hex.toUpperCase() === "#FAF7F4") {
      continue;
    }
    const key = hex.toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([hex]) => hex);
}
