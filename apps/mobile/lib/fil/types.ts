import type { MandalaTheme } from "@/lib/mandala/types";
import type { ArtisticTechnique } from "@/lib/types";

export type FilSource =
  | "ritual"
  | "mandala"
  | "nuances"
  | "ping-pong"
  | "color-journey"
  | "emotion-explorer"
  | "zen-garden";

export interface FilMetadata {
  colors?: string[];
  impulse?: string;
  technique?: ArtisticTechnique;
  theme?: MandalaTheme;
  chain?: string;
  exercise?: string;
  durationMinutes?: number;
  reflection?: string;
  openQuestions?: string[];
  writtenText?: string;
  followUpExercise?: string;
  photoUri?: string;
}

export interface FilEntry {
  id: string;
  source: FilSource;
  summary: string;
  detail?: string;
  metadata?: FilMetadata;
  createdAt: string;
}

export const FIL_SOURCE_META: Record<
  FilSource,
  { label: string; emoji: string }
> = {
  ritual: { label: "Rituel", emoji: "✨" },
  mandala: { label: "Mandala", emoji: "🪷" },
  nuances: { label: "Nuances", emoji: "🎨" },
  "ping-pong": { label: "Ping-Pong", emoji: "🏓" },
  "color-journey": { label: "Palette intérieure", emoji: "🌈" },
  "emotion-explorer": { label: "Explorateur émotionnel", emoji: "💭" },
  "zen-garden": { label: "Jardin zen", emoji: "🏯" },
};

export function isRitualFilEntry(entry: FilEntry): boolean {
  return (
    entry.source === "ritual" &&
    Boolean(entry.metadata?.technique && entry.metadata?.exercise)
  );
}
