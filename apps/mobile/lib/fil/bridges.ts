import { InteractionManager } from "react-native";
import { router } from "expo-router";
import {
  type ColorForImpulse,
  resolveColorLabel,
} from "@/lib/color-names";
import { generateExercise } from "@/lib/api";
import { getFallbackExercise } from "@/lib/ritual/fallback";
import { FEATURES } from "@/lib/features";
import type { MandalaTheme } from "@/lib/mandala/types";
import { setMandalaCustomPalette } from "@/lib/mandala/customPalette";
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

export function openMandalaStudio(theme: MandalaTheme = "calm"): void {
  if (!FEATURES.mandala) return;
  router.push({ pathname: "/mandala/studio", params: { theme } });
}

export async function openMandalaWithPalette(
  colors: string[],
  theme: MandalaTheme = "calm"
): Promise<void> {
  if (!FEATURES.mandala) return;
  await setMandalaCustomPalette(colors);
  openMandalaStudio(theme);
}

export function extractDominantColors(
  fills: Record<string, string>,
  limit = 3
): string[] {
  const counts = new Map<string, number>();
  for (const hex of Object.values(fills)) {
    if (!hex || hex.toUpperCase() === "#FFFFFF" || hex.toUpperCase() === "#FAF7F4") {
      continue;
    }
    const key = hex.toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([hex]) => hex);
}
