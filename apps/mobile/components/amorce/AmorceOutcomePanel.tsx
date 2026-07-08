import { useState } from "react";
import { Text, View } from "react-native";
import { DurationPicker } from "@/components/DurationPicker";
import { TechniquePicker } from "@/components/TechniquePicker";
import { PrimaryButton } from "@/components/ui/Button";
import { TECHNIQUES } from "@/constants";
import type { RitualDuration } from "@/constants";
import {
  startExerciseFromImpulse,
  startRitualFromImpulse,
  type ColorBridgeHints,
} from "@/lib/fil/bridges";
import type { ArtisticTechnique } from "@/lib/types";
import { showAlert } from "@/lib/alert";
import { ApiError } from "@/lib/api";

interface AmorceOutcomePanelProps {
  impulse: string;
  augmentationContext?: string;
  colorHints?: ColorBridgeHints;
  disabled?: boolean;
}

export function AmorceOutcomePanel({
  impulse,
  augmentationContext,
  colorHints,
  disabled = false,
}: AmorceOutcomePanelProps) {
  const [technique, setTechnique] = useState<ArtisticTechnique | null>(
    "painting"
  );
  const [duration, setDuration] = useState<RitualDuration>(15);
  const [busy, setBusy] = useState(false);

  const trimmed = impulse.trim();
  const isDisabled = disabled || busy || !trimmed || !technique;
  const bridgeColorHints: ColorBridgeHints | undefined =
    colorHints ??
    (augmentationContext?.trim()
      ? { colorContext: augmentationContext.trim() }
      : undefined);

  async function handleExercise() {
    if (!technique || !trimmed) return;
    setBusy(true);
    try {
      await startExerciseFromImpulse(
        trimmed,
        technique,
        duration,
        augmentationContext,
        bridgeColorHints
      );
    } catch (error) {
      showAlert(
        "Impossible de continuer",
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Une erreur est survenue. Réessayez dans un instant."
      );
    } finally {
      setBusy(false);
    }
  }

  function handleRitual() {
    if (!technique || !trimmed) return;
    startRitualFromImpulse(trimmed, technique, duration, bridgeColorHints);
  }

  return (
    <View className="gap-4 bg-sage-50/80 rounded-2xl border border-sage-100 px-4 py-4">
      <Text className="text-sage-700 text-sm font-medium">
        Poursuivre votre création
      </Text>
      <Text className="text-sand-600 text-xs leading-5">
        Choisissez technique et durée, puis le parcours rituel (avec choix
        d&apos;expérience) ou l&apos;exercice direct.
      </Text>

      <View>
        <Text className="text-sand-600 text-xs uppercase tracking-wider mb-2">
          Technique
        </Text>
        <TechniquePicker
          selected={technique}
          onSelect={setTechnique}
          techniques={TECHNIQUES}
        />
      </View>

      <View>
        <Text className="text-sand-600 text-xs uppercase tracking-wider mb-2">
          Durée
        </Text>
        <DurationPicker selected={duration} onSelect={setDuration} />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <PrimaryButton
            label="Parcours rituel"
            onPress={handleRitual}
            variant="ghost"
            disabled={isDisabled}
          />
        </View>
        <View className="flex-1">
          <PrimaryButton
            label={busy ? "Préparation…" : "Exercice direct"}
            onPress={() => void handleExercise()}
            disabled={isDisabled}
          />
        </View>
      </View>
    </View>
  );
}
