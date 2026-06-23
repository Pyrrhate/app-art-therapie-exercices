import type { ArtisticTechnique } from "@/lib/types";
import type { TechniqueCategoryId } from "./types";

const CATEGORY_TECHNIQUES: Record<TechniqueCategoryId, ArtisticTechnique[]> = {
  visual: ["drawing", "painting", "mixed_media", "collage"],
  dance: ["dance"],
  theatre: ["theatre"],
  music: ["music", "video"],
};

const CATEGORY_DEFAULT: Record<TechniqueCategoryId, ArtisticTechnique> = {
  visual: "drawing",
  dance: "dance",
  theatre: "theatre",
  music: "music",
};

export function resolveTechniqueFromCategory(
  categoryId: TechniqueCategoryId,
  seed = ""
): ArtisticTechnique {
  const pool = CATEGORY_TECHNIQUES[categoryId];
  if (pool.length <= 1) {
    return pool[0] ?? CATEGORY_DEFAULT[categoryId];
  }
  if (!seed) {
    return CATEGORY_DEFAULT[categoryId];
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % pool.length;
  }
  return pool[hash] ?? CATEGORY_DEFAULT[categoryId];
}

export function isTechniqueCategoryId(
  value: string
): value is TechniqueCategoryId {
  return value === "visual" || value === "dance" || value === "theatre" || value === "music";
}
