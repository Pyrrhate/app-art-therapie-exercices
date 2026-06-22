import { z } from "zod";
import {
  ARTISTIC_TECHNIQUES,
  type ArtisticTechnique,
} from "@art-therapie/shared";

export {
  ARTISTIC_TECHNIQUES,
  TECHNIQUE_LABELS,
  isAiAnalysisSupported,
} from "@art-therapie/shared";

export const artisticTechniqueSchema = z.enum(
  ARTISTIC_TECHNIQUES as unknown as [ArtisticTechnique, ...ArtisticTechnique[]]
);
