import { useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DurationPicker } from "@/components/DurationPicker";
import { TechniquePicker } from "@/components/TechniquePicker";
import { PrimaryButton } from "@/components/ui/Button";
import type { RitualDuration } from "@/constants";
import {
  startExerciseFromImpulse,
  startRitualFromImpulse,
  type ColorBridgeHints,
} from "@/lib/fil/bridges";
import { useEnabledTechniques } from "@/lib/techniques/managed";
import type { ArtisticTechnique } from "@/lib/types";
import { showAlert } from "@/lib/alert";
import { ApiError } from "@/lib/api";

interface AmorceOutcomePanelProps {
  impulse: string;
  /**
   * Contexte du module (palette, nuances…) — visible dans l'énoncé,
   * jamais transmis comme directive de génération IA.
   */
  moduleStatement?: string;
  /** @deprecated Utiliser moduleStatement */
  augmentationContext?: string;
  colorHints?: ColorBridgeHints;
  disabled?: boolean;
}

export function AmorceOutcomePanel({
  impulse,
  moduleStatement,
  augmentationContext,
  colorHints,
  disabled = false,
}: AmorceOutcomePanelProps) {
  const { t } = useTranslation("amorces");
  const techniques = useEnabledTechniques();
  const [technique, setTechnique] = useState<ArtisticTechnique | null>(
    "painting"
  );
  const [duration, setDuration] = useState<RitualDuration>(15);
  const [busy, setBusy] = useState(false);

  const statement = (moduleStatement ?? augmentationContext)?.trim() || undefined;
  const trimmed = impulse.trim();
  const isDisabled = disabled || busy || !trimmed || !technique;
  const bridgeColorHints: ColorBridgeHints | undefined =
    colorHints ??
    (statement ? { colorContext: statement } : undefined);

  async function handleExercise() {
    if (!technique || !trimmed) return;
    setBusy(true);
    try {
      await startExerciseFromImpulse(
        trimmed,
        technique,
        duration,
        statement,
        bridgeColorHints
      );
    } catch (error) {
      showAlert(
        t("errors.cannotContinue"),
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("errors.generic")
      );
    } finally {
      setBusy(false);
    }
  }

  function handleRitual() {
    if (!technique || !trimmed) return;
    startRitualFromImpulse(
      trimmed,
      technique,
      duration,
      bridgeColorHints,
      statement
    );
  }

  return (
    <View className="gap-4 bg-sage-50/80 rounded-2xl border border-sage-100 px-4 py-4">
      <Text className="text-sage-700 text-sm font-medium">
        {t("outcome.title")}
      </Text>
      <Text className="text-sand-600 text-xs leading-5">
        {t("outcome.description")}
      </Text>

      <View>
        <Text className="text-sand-600 text-xs uppercase tracking-wider mb-2">
          {t("outcome.technique")}
        </Text>
        <TechniquePicker
          selected={technique}
          onSelect={setTechnique}
          techniques={techniques}
        />
      </View>

      <View>
        <Text className="text-sand-600 text-xs uppercase tracking-wider mb-2">
          {t("outcome.duration")}
        </Text>
        <DurationPicker selected={duration} onSelect={setDuration} />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <PrimaryButton
            label={t("outcome.ritual")}
            onPress={handleRitual}
            variant="ghost"
            disabled={isDisabled}
          />
        </View>
        <View className="flex-1">
          <PrimaryButton
            label={busy ? t("outcome.preparing") : t("outcome.direct")}
            onPress={() => void handleExercise()}
            disabled={isDisabled}
          />
        </View>
      </View>
    </View>
  );
}
