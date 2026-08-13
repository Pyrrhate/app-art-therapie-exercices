import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ColorSwatch } from "@/components/color-journey/ColorSwatch";
import {
  COLOR_JOURNEY_TURN_COUNT,
  getDimensionForTurn,
} from "@/lib/color-journey/dimensions";
import type { ColorChoice } from "@/lib/color-journey/types";
import { useLanguageStore } from "@/lib/i18n/languageStore";

interface JourneyProgressProps {
  currentTurn: number;
  history: ColorChoice[];
}

export function JourneyProgress({ currentTurn, history }: JourneyProgressProps) {
  const { t } = useTranslation("amorces");
  const language = useLanguageStore((s) => s.language);
  const activeTurn = Math.min(currentTurn, COLOR_JOURNEY_TURN_COUNT);
  const activeDimension = getDimensionForTurn(activeTurn, language);

  return (
    <View className="mb-6">
      <Text className="text-sand-400 text-xs text-center mb-1 uppercase tracking-wider">
        {t("colorJourney.progressStep", {
          current: activeTurn,
          total: COLOR_JOURNEY_TURN_COUNT,
        })}
      </Text>
      <Text className="text-sand-500 text-xs text-center mb-3">
        {activeDimension.title || t("colorJourney.progressFallback")}
      </Text>
      <View className="flex-row justify-center gap-2 flex-wrap px-2">
        {Array.from({ length: COLOR_JOURNEY_TURN_COUNT }, (_, i) => {
          const choice = history[i];
          const isCurrent = i + 1 === currentTurn && !choice;
          const role = getDimensionForTurn(i + 1, language).shortTitle;
          return (
            <View key={i} className="items-center">
              <ColorSwatch
                hex={choice?.hex ?? "#FAF7F4"}
                size={28}
                className={
                  isCurrent
                    ? "border-2 border-sage-500"
                    : choice
                      ? "border-2 border-sand-200"
                      : "border-2 border-dashed border-sand-300"
                }
              />
              <Text className="text-sand-400 text-[10px] mt-1 capitalize">
                {role}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
