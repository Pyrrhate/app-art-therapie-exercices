import { z } from "zod";
import type { ArtisticTechnique } from "./types";

export const ARTISTIC_TECHNIQUES = [
  "drawing",
  "painting",
  "writing",
  "mixed_media",
  "recyclart",
  "collage",
  "volume",
  "video",
  "music",
  "dance",
  "theatre",
] as const satisfies readonly ArtisticTechnique[];

export const artisticTechniqueSchema = z.enum(ARTISTIC_TECHNIQUES);

export const TECHNIQUE_LABELS: Record<ArtisticTechnique, string> = {
  drawing: "Dessin",
  painting: "Peinture",
  writing: "Écriture",
  mixed_media: "Techniques mixtes",
  recyclart: "Recycl'art",
  collage: "Collage",
  volume: "Volume (sculpture / modelage)",
  video: "Vidéo",
  music: "Musique",
  dance: "Danse",
  theatre: "Théâtre",
};

const NO_AI_ANALYSIS: ArtisticTechnique[] = [
  "video",
  "music",
  "dance",
  "theatre",
];

export function isAiAnalysisSupported(technique: ArtisticTechnique): boolean {
  return !NO_AI_ANALYSIS.includes(technique);
}
