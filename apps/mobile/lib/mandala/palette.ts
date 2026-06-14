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
