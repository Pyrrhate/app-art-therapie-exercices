import type { MandalaTheme } from "@/lib/mandala/types";
import type { ArtisticTechnique } from "@/lib/types";

export type FilSource =
  | "ritual"
  | "mandala"
  | "nuances"
  | "ping-pong"
  | "color-journey";

export interface FilEntry {
  id: string;
  source: FilSource;
  summary: string;
  detail?: string;
  metadata?: {
    colors?: string[];
    impulse?: string;
    technique?: ArtisticTechnique;
    theme?: MandalaTheme;
    chain?: string;
  };
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
};
