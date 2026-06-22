import { InteractionManager } from "react-native";
import { router } from "expo-router";
import {
  type ColorForImpulse,
  resolveColorLabel,
} from "@/lib/color-names";
import { generateExercise } from "@/lib/api";
import { getFallbackExercise } from "@/lib/ritual/fallback";
import { useRitualStore } from "@/lib/store";
import type { ArtisticTechnique, ExerciseResponse } from "@/lib/types";
import type { RitualDuration } from "@/constants";

export function startRitualFromImpulse(
  impulse: string,
  technique: ArtisticTechnique = "mixed_media"
): void {
  const store = useRitualStore.getState();
  store.reset();
  store.setImpulse(impulse.trim());
  store.setTechnique(technique);
  router.push("/ritual");
}

/** Amorce → exercice direct (technique et durée déjà choisies ou par défaut). */
export async function startExerciseFromImpulse(
  impulse: string,
  technique: ArtisticTechnique = "mixed_media",
  durationMinutes?: RitualDuration
): Promise<void> {
  const trimmed = impulse.trim();
  if (!trimmed) {
    throw new Error("Impulsion vide");
  }

  const store = useRitualStore.getState();
  store.reset();
  store.setImpulse(trimmed);
  store.setTechnique(technique);
  const minutes = durationMinutes ?? 15;
  store.setDurationMinutes(minutes);

  let result: ExerciseResponse;
  try {
    result = await generateExercise(trimmed, technique, minutes);
  } catch {
    result = getFallbackExercise(trimmed, technique, minutes);
  }

  if (!result.exercise?.trim()) {
    result = getFallbackExercise(trimmed, technique, minutes);
  }

  store.setExercise(
    result.exercise,
    minutes,
    result.source,
    result.keywords
  );

  if (!useRitualStore.getState().exercise?.trim()) {
    throw new Error("Impossible de préparer l'exercice");
  }

  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      router.replace("/exercise");
      resolve();
    });
  });
}

export function startRitualFromColors(
  colors: ColorForImpulse[],
  label = "Nuancier"
): void {
  const names = [
    ...new Set(colors.filter(Boolean).map((c) => resolveColorLabel(c))),
  ].slice(0, 4);
  const impulse =
    names.length > 0
      ? `${label} : ${names.join(", ")}`
      : `${label} du moment`;
  startRitualFromImpulse(impulse, "painting");
}
