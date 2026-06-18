import type { ArtisticTechnique } from "@/lib/types";

export type TechniqueDefinition = {
  id: ArtisticTechnique;
  label: string;
  emoji: string;
  /** Analyse IA disponible en phase réflexion (photo / OCR). */
  aiAnalysis: boolean;
};

export const TECHNIQUES: TechniqueDefinition[] = [
  { id: "drawing", label: "Dessin", emoji: "✏️", aiAnalysis: true },
  { id: "painting", label: "Peinture", emoji: "🎨", aiAnalysis: true },
  { id: "writing", label: "Écriture", emoji: "📝", aiAnalysis: true },
  { id: "mixed_media", label: "Techniques mixtes", emoji: "🌀", aiAnalysis: true },
  { id: "collage", label: "Collage", emoji: "✂️", aiAnalysis: true },
  { id: "volume", label: "Volume", emoji: "🗿", aiAnalysis: true },
  { id: "recyclart", label: "Recycl'art", emoji: "♻️", aiAnalysis: true },
  { id: "video", label: "Vidéo", emoji: "🎬", aiAnalysis: false },
  { id: "music", label: "Musique", emoji: "🎵", aiAnalysis: false },
  { id: "dance", label: "Danse", emoji: "💃", aiAnalysis: false },
  { id: "theatre", label: "Théâtre", emoji: "🎭", aiAnalysis: false },
];

export function getTechniqueLabel(id: string): string {
  return TECHNIQUES.find((t) => t.id === id)?.label ?? id;
}

export function isAiAnalysisSupported(technique: ArtisticTechnique): boolean {
  return TECHNIQUES.find((t) => t.id === technique)?.aiAnalysis ?? true;
}

export const TECHNIQUES_WITHOUT_AI = TECHNIQUES.filter((t) => !t.aiAnalysis);

export const DURATION_OPTIONS = [15, 30, 45] as const;

export type RitualDuration = (typeof DURATION_OPTIONS)[number];

export const STORAGE_KEYS = {
  sessions: "@art_therapie/sessions",
  mandalaProgress: "@art_therapie/mandala_progress",
  ritualDraft: "@art_therapie/ritual_draft",
  creativeFil: "@art_therapie/creative_fil",
  mandalaCustomPalette: "@art_therapie/mandala_custom_palette",
  zenGarden: "@art_therapie/zen_garden",
} as const;

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
