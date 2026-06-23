import { generateExercise } from "@/lib/api";
import type { ExerciseResponse } from "@/lib/types";
import { buildCustomImpulse } from "./buildImpulse";
import { isTechniqueCategoryId, resolveTechniqueFromCategory } from "./mapTechnique";
import type { CustomSessionConfig } from "./types";
import { isCustomSessionComplete } from "./types";

export function prepareCustomSession(config: CustomSessionConfig): {
  impulse: string;
  technique: ReturnType<typeof resolveTechniqueFromCategory>;
} {
  if (!isCustomSessionComplete(config)) {
    throw new Error("Configuration sur-mesure incomplète.");
  }
  if (!isTechniqueCategoryId(config.technique)) {
    throw new Error("Catégorie de technique invalide.");
  }

  const impulse = buildCustomImpulse(config);
  const technique = resolveTechniqueFromCategory(
    config.technique,
    `${config.theme}-${config.emotion}-${config.goal}`
  );

  return { impulse, technique };
}

export async function generateCustomExercise(
  config: CustomSessionConfig,
  durationMinutes?: number
): Promise<ExerciseResponse & { impulse: string; technique: ReturnType<typeof resolveTechniqueFromCategory> }> {
  const { impulse, technique } = prepareCustomSession(config);
  const result = await generateExercise(impulse, technique, durationMinutes);
  return { ...result, impulse, technique };
}
