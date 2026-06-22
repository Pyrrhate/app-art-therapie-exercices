export type ArtisticTechnique =
  | "drawing"
  | "painting"
  | "writing"
  | "mixed_media"
  | "recyclart"
  | "collage"
  | "volume"
  | "video"
  | "music"
  | "dance"
  | "theatre";

export const DURATION_OPTIONS = [15, 30, 45] as const;
export type RitualDuration = (typeof DURATION_OPTIONS)[number];
