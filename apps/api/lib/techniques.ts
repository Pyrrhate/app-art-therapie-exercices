import { z } from "zod";
import {
  ARTISTIC_TECHNIQUES,
  TECHNIQUE_LABELS,
  type ArtisticTechnique,
} from "@art-therapie/shared";

export {
  ARTISTIC_TECHNIQUES,
  TECHNIQUE_LABELS,
  isAiAnalysisSupported,
} from "@art-therapie/shared";

export const TECHNIQUE_LABELS_EN: Record<ArtisticTechnique, string> = {
  drawing: "Drawing",
  painting: "Painting",
  writing: "Writing",
  mixed_media: "Mixed media",
  recyclart: "Recycled art",
  collage: "Collage",
  volume: "Volume & 3D",
  video: "Video",
  music: "Music",
  dance: "Dance",
  theatre: "Theatre",
};

export function techniqueLabelForLanguage(
  technique: ArtisticTechnique,
  language: "fr" | "en" = "fr"
): string {
  return language === "en"
    ? TECHNIQUE_LABELS_EN[technique]
    : TECHNIQUE_LABELS[technique];
}

export const artisticTechniqueSchema = z.enum(
  ARTISTIC_TECHNIQUES as unknown as [ArtisticTechnique, ...ArtisticTechnique[]]
);
