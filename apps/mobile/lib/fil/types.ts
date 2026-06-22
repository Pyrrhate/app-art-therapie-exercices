import type { PastekIconId } from "@/components/ui/ModuleIcon";
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
  /** Anciennes traces mandala (module abandonné). */
  theme?: string;
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
  { label: string; icon: PastekIconId }
> = {
  ritual: { label: "Rituel", icon: "ritual" },
  mandala: { label: "Mandala", icon: "mandala" },
  nuances: { label: "Nuances", icon: "nuance-finder" },
  "ping-pong": { label: "Ping-Pong", icon: "ping-pong" },
  "color-journey": { label: "Palette intérieure", icon: "color-journey" },
  "emotion-explorer": { label: "Explorateur émotionnel", icon: "emotion-explorer" },
  "zen-garden": { label: "Jardin zen", icon: "zen-garden" },
};

export function isRitualFilEntry(entry: FilEntry): boolean {
  return (
    entry.source === "ritual" &&
    Boolean(entry.metadata?.technique && entry.metadata?.exercise)
  );
}
