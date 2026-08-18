import type { TFunction } from "i18next";
import type { PastekIconId } from "@/components/ui/ModuleIcon";
import type { ArtisticTechnique } from "@/lib/types";

export type FilSource =
  | "ritual"
  | "note"
  | "mandala"
  | "nuances"
  | "ping-pong"
  | "color-journey"
  | "emotion-explorer"
  | "three-gestures"
  | "one-rule"
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
  /** Miroir d'approfondissement (opt-in), distinct du miroir initial. */
  deepenedReflection?: string;
  openQuestions?: string[];
  deepenedOpenQuestions?: string[];
  writtenText?: string;
  followUpExercise?: string;
  photoUri?: string;
  seasonId?: string;
  seasonTitle?: string;
  /** Notes personnelles (jamais envoyées à l'IA). */
  privateNotes?: string;
  /** Photos personnelles (URI locales / IndexedDB). */
  privatePhotoUris?: string[];
  /** Id d'une ancienne entrée journal migrée. */
  sessionLogId?: string;
  /** Un 2e tour a déjà été réalisé sur cette trace. */
  hasSecondRound?: boolean;
  round2Reflection?: string;
  round2Exercise?: string;
  round2PhotoUri?: string;
  round2WrittenText?: string;
  round2OpenQuestions?: string[];
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
  note: { labelKey: "source.note", icon: "writing" },
  mandala: { labelKey: "source.mandala", icon: "mandala" },
  nuances: { labelKey: "source.nuances", icon: "nuance-finder" },
  "ping-pong": { labelKey: "source.ping-pong", icon: "ping-pong" },
  "color-journey": { labelKey: "source.color-journey", icon: "color-journey" },
  "emotion-explorer": {
    labelKey: "source.emotion-explorer",
    icon: "emotion-explorer",
  },
  "three-gestures": {
    labelKey: "source.three-gestures",
    icon: "three-gestures",
  },
  "one-rule": { labelKey: "source.one-rule", icon: "one-rule" },
  "zen-garden": { labelKey: "source.zen-garden", icon: "zen-garden" },
};

/** Libellé traduit de la source d'une trace (namespace `fil`). */
export function getFilSourceLabel(
  source: FilSource,
  t: FilTranslator
): string {
  return t(FIL_SOURCE_META[source].labelKey);
}

export function isNoteFilEntry(entry: FilEntry): boolean {
  return entry.source === "note";
}

export function isRitualFilEntry(entry: FilEntry): boolean {
  return (
    entry.source === "ritual" &&
    Boolean(entry.metadata?.technique && entry.metadata?.exercise)
  );
}

/** True si un 2e tour est déjà rattaché à cette trace. */
export function hasCompletedSecondRound(entry: FilEntry): boolean {
  if (entry.metadata?.hasSecondRound) return true;
  if (entry.metadata?.round2Reflection?.trim()) return true;
  return / · 2e tour| · second round/i.test(entry.summary ?? "");
}
