export type EmotionQuadrantId =
  | "high_unpleasant"
  | "high_pleasant"
  | "low_unpleasant"
  | "low_pleasant";

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

export type EmotionExplorerPhase = "quadrant" | "emotion";
