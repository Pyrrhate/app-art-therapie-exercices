import { InteractionManager } from "react-native";
import { router } from "expo-router";
import { ROUTES } from "@/lib/routes";
import {
  type ColorForImpulse,
  resolveColorLabel,
} from "@/lib/color-names";
import { generateExercise } from "@/lib/api";
import { getFallbackExercise } from "@/lib/ritual/fallback";
import { useRitualStore } from "@/lib/store";
import type { ArtisticTechnique, ExerciseResponse } from "@/lib/types";
import type { RitualDuration } from "@/constants";

export interface ColorBridgeHints {
  colorContext?: string;
  paletteColors?: string[];
}

function applyColorHints(hints?: ColorBridgeHints): void {
  if (!hints?.colorContext?.trim() && !hints?.paletteColors?.length) return;
  const store = useRitualStore.getState();
  store.setColorContext(
    hints.colorContext?.trim() ?? null,
    hints.paletteColors
  );
}

export function startRitualFromImpulse(
  impulse: string,
  technique: ArtisticTechnique = "mixed_media",
  durationMinutes: RitualDuration = 15,
  colorHints?: ColorBridgeHints,
  moduleStatement?: string
): void {
  const store = useRitualStore.getState();
  store.reset();
  store.setImpulse(impulse.trim());
  store.setTechnique(technique);
  store.setDurationMinutes(durationMinutes);
  store.setModuleStatement(moduleStatement?.trim() || null);
  applyColorHints(colorHints);
  router.push(ROUTES.ritual);
}

/**
 * Amorce → exercice direct.
 * `moduleStatement` est affiché dans l'énoncé mais n'est PAS envoyé comme directive IA
 * (contrairement à `augmentationContext`, réservé au 2e tour).
 */
export async function startExerciseFromImpulse(
  impulse: string,
  technique: ArtisticTechnique = "mixed_media",
  durationMinutes?: RitualDuration,
  moduleStatement?: string,
  colorHints?: ColorBridgeHints
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
  store.setModuleStatement(moduleStatement?.trim() || null);
  applyColorHints(colorHints);

  let result: ExerciseResponse;
  try {
    // Pas d'augmentationContext : l'IA reçoit seulement impulsion + technique.
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
    result.keywords,
    result.fallbackNote,
    result.development
  );

  if (!useRitualStore.getState().exercise?.trim()) {
    throw new Error("Impossible de préparer l'exercice");
  }

  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      router.replace(ROUTES.exercise);
      resolve();
    });
  });
}

export function startRitualFromColors(
  colors: ColorForImpulse[],
  label = "Nuancier",
  colorContext?: string
): void {
  const names = [
    ...new Set(colors.filter(Boolean).map((c) => resolveColorLabel(c))),
  ].slice(0, 4);
  const impulse =
    names.length > 0
      ? `${label} : ${names.join(", ")}`
      : `${label} du moment`;
  const hexes = colors
    .map((c) => (typeof c === "string" ? c : c.hex))
    .filter(Boolean);
  startRitualFromImpulse(impulse, "painting", 15, {
    colorContext,
    paletteColors: hexes,
  }, colorContext);
}
