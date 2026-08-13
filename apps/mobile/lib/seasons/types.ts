import type { ArtisticTechnique } from "@/lib/types";

export type SeasonKind = "color" | "format" | "technique" | "gesture" | "custom";
export type SeasonDuration = 7 | 10 | 14;
export type SeasonStatus = "active" | "completed" | "abandoned";

export interface SeasonDefinition {
  id: string;
  title: string;
  durationDays: SeasonDuration;
  kind: SeasonKind;
  /** Contrainte courte, visible dans l'énoncé. */
  constraint: string;
  /** Texte éditorial pour la fiche. */
  invitation: string;
  suggestedTechnique?: ArtisticTechnique;
  suggestedImpulse?: string;
  accent: string;
}

export interface SeasonRun {
  id: string;
  catalogId: string;
  title: string;
  constraint: string;
  durationDays: number;
  kind: SeasonKind;
  startedAt: string;
  /** Jours calendaires (YYYY-MM-DD) où une séance a été enregistrée. */
  completedDates: string[];
  status: SeasonStatus;
  suggestedTechnique?: ArtisticTechnique;
  suggestedImpulse?: string;
  custom?: boolean;
}

export interface SeasonsState {
  active: SeasonRun | null;
  history: SeasonRun[];
}
