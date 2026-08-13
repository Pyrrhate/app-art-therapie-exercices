import type { TFunction } from "i18next";
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
  paletteLabels?: string[];
  harmonyName?: string;
  discoveredElements?: string[];
  colorMirror?: string;
  colorContext?: string;
  paletteSource?: "nuances" | "color-journey";
  impulse?: string;
  technique?: ArtisticTechnique;
  techniqueLabel?: string;
  /** Anciennes traces mandala (module abandonné). */
  theme?: string;
  chain?: string;
  exercise?: string;
  exerciseDevelopment?: string;
  moduleStatement?: string;
  durationMinutes?: number;
  reflection?: string;
  openQuestions?: string[];
  writtenText?: string;
  followUpExercise?: string;
  photoUri?: string;
  seasonId?: string;
  seasonTitle?: string;
}

export interface FilEntry {
  id: string;
  source: FilSource;
  summary: string;
  detail?: string;
  metadata?: FilMetadata;
  /** Tags libres ajoutés par l'utilisateur (en plus de la technique). */
  tags?: string[];
  createdAt: string;
  /** true après envoi réussi vers Supabase creative_threads */
  synced?: boolean;
  syncedAt?: string;
}

/** `t` du namespace `fil` (hook ou i18n.getFixedT(lng, "fil")). */
export type FilTranslator = TFunction<"fil">;

export const FIL_SOURCE_META: Record<
  FilSource,
  { labelKey: string; icon: PastekIconId }
> = {
  ritual: { labelKey: "source.ritual", icon: "ritual" },
  mandala: { labelKey: "source.mandala", icon: "mandala" },
  nuances: { labelKey: "source.nuances", icon: "nuance-finder" },
  "ping-pong": { labelKey: "source.ping-pong", icon: "ping-pong" },
  "color-journey": { labelKey: "source.color-journey", icon: "color-journey" },
  "emotion-explorer": {
    labelKey: "source.emotion-explorer",
    icon: "emotion-explorer",
  },
  "zen-garden": { labelKey: "source.zen-garden", icon: "zen-garden" },
};

/** Libellé traduit de la source d'une trace (namespace `fil`). */
export function getFilSourceLabel(
  source: FilSource,
  t: FilTranslator
): string {
  return t(FIL_SOURCE_META[source].labelKey);
}

export function isRitualFilEntry(entry: FilEntry): boolean {
  return (
    entry.source === "ritual" &&
    Boolean(entry.metadata?.technique && entry.metadata?.exercise)
  );
}
