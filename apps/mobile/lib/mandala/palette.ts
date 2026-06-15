import type { MandalaTheme } from "./types";

export type { MandalaTheme };

/** Palette harmonieuse — crème, sauge, tons doux. */
export const MANDALA_COLORS = [
  { id: "cream", hex: "#FAF7F4", label: "Crème" },
  { id: "sage", hex: "#6B8F71", label: "Sauge" },
  { id: "sage-light", hex: "#8FA88A", label: "Sauge clair" },
  { id: "sand", hex: "#E8DDD4", label: "Sable" },
  { id: "clay", hex: "#A8856A", label: "Terre" },
  { id: "mist", hex: "#D4C4B5", label: "Brume" },
  { id: "forest", hex: "#527058", label: "Forêt" },
  { id: "pearl", hex: "#FFFFFF", label: "Perle" },
] as const;

export const DEFAULT_MANDALA_FILL = "#FFFFFF";

/** Taille d'affichage max du mandala à l'écran (px). */
export const MANDALA_DISPLAY_MAX = 480;
export const MANDALA_DISPLAY_MIN = 360;
export const MANDALA_DISPLAY_PADDING = 48;

export function getMandalaDisplaySize(windowWidth: number): number {
  return Math.min(
    MANDALA_DISPLAY_MAX,
    Math.max(MANDALA_DISPLAY_MIN, windowWidth - MANDALA_DISPLAY_PADDING)
  );
}

export const MANDALA_THEME_LABELS: Record<
  MandalaTheme,
  { title: string; subtitle: string; emoji: string }
> = {
  calm: {
    title: "M'apaiser",
    subtitle: "Courbes douces, lotus, espaces ouverts",
    emoji: "🪷",
  },
  energy: {
    title: "Canaliser mon énergie",
    subtitle: "Angles vifs, étoiles, motifs denses",
    emoji: "⚡",
  },
  focus: {
    title: "Me recentrer",
    subtitle: "Anneaux concentriques, équilibre géométrique",
    emoji: "◎",
  },
};

/** Palette de départ suggérée par thème — toujours modifiable via le picker. */
export const THEME_SUGGESTED_PALETTES: Record<MandalaTheme, string[]> = {
  calm: ["#FAF7F4", "#6B8F71", "#8FA88A", "#D4C4B5", "#527058", "#E8DDD4"],
  energy: ["#FAF7F4", "#E8A84A", "#C45C4A", "#FFD700", "#6B8F71", "#A8856A"],
  focus: ["#FFFFFF", "#527058", "#6B8F71", "#A8856A", "#E8DDD4", "#D4C4B5"],
};

export function getThemeSuggestedPalette(theme: MandalaTheme): string[] {
  return THEME_SUGGESTED_PALETTES[theme];
}

export function getThemeDefaultColor(theme: MandalaTheme): string {
  return THEME_SUGGESTED_PALETTES[theme][1] ?? MANDALA_COLORS[1].hex;
}
