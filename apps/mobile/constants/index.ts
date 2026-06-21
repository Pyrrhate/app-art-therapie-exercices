import type { ArtisticTechnique } from "@/lib/types";

export type TechniqueDefinition = {
  id: ArtisticTechnique;
  label: string;
  /** Analyse IA disponible en phase réflexion (photo / OCR). */
  aiAnalysis: boolean;
};

export const TECHNIQUES: TechniqueDefinition[] = [
  { id: "drawing", label: "Dessin", aiAnalysis: true },
  { id: "painting", label: "Peinture", aiAnalysis: true },
  { id: "writing", label: "Écriture", aiAnalysis: true },
  { id: "mixed_media", label: "Techniques mixtes", aiAnalysis: true },
  { id: "collage", label: "Collage", aiAnalysis: true },
  { id: "volume", label: "Volume", aiAnalysis: true },
  { id: "recyclart", label: "Recycl'art", aiAnalysis: true },
  { id: "video", label: "Vidéo", aiAnalysis: false },
  { id: "music", label: "Musique", aiAnalysis: false },
  { id: "dance", label: "Danse", aiAnalysis: false },
  { id: "theatre", label: "Théâtre", aiAnalysis: false },
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
