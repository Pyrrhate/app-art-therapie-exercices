import type { ArtisticTechnique } from "@/lib/types";

export const TECHNIQUES: {
  id: ArtisticTechnique;
  label: string;
  emoji: string;
}[] = [
  { id: "drawing", label: "Dessin", emoji: "✏️" },
  { id: "painting", label: "Peinture", emoji: "🎨" },
  { id: "writing", label: "Écriture", emoji: "📝" },
  { id: "mixed_media", label: "Techniques mixtes", emoji: "🌀" },
  { id: "collage", label: "Collage", emoji: "✂️" },
  { id: "volume", label: "Volume", emoji: "🗿" },
  { id: "recyclart", label: "Recycl'art", emoji: "♻️" },
];

export const DURATION_OPTIONS = [15, 30, 45] as const;

export type RitualDuration = (typeof DURATION_OPTIONS)[number];

export const STORAGE_KEYS = {
  sessions: "@art_therapie/sessions",
  mandalaProgress: "@art_therapie/mandala_progress",
  ritualDraft: "@art_therapie/ritual_draft",
} as const;

export function getTechniqueLabel(id: string): string {
  return TECHNIQUES.find((t) => t.id === id)?.label ?? id;
}

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
