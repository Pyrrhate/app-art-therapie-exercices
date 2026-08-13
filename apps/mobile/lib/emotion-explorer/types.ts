import type { AppLanguage } from "@/lib/i18n/types";

export type EmotionQuadrantId =
  | "high_unpleasant"
  | "high_pleasant"
  | "low_unpleasant"
  | "low_pleasant"
  | "neutral";

/** Texte disponible dans chaque langue de l'interface. */
export type LocalizedText = Record<AppLanguage, string>;

export interface EmotionQuadrant {
  id: EmotionQuadrantId;
  title: string;
  subtitle: string;
  color: string;
  bubbleColor: string;
  energyLabel: string;
  valenceLabel: string;
}

export interface Emotion {
  id: string;
  quadrantId: EmotionQuadrantId;
  label: string;
  description: string;
}

/** Entrée de catalogue : les libellés existent en FR et EN. */
export interface LocalizedEmotionQuadrant
  extends Omit<
    EmotionQuadrant,
    "title" | "subtitle" | "energyLabel" | "valenceLabel"
  > {
  title: LocalizedText;
  subtitle: LocalizedText;
  energyLabel: LocalizedText;
  valenceLabel: LocalizedText;
}

export interface LocalizedEmotion
  extends Omit<Emotion, "label" | "description"> {
  label: LocalizedText;
  description: LocalizedText;
}

export type EmotionExplorerPhase = "quadrant" | "emotion";
