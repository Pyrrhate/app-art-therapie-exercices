import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ArtisticTechnique } from "@/lib/types";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";

interface ExerciseKeywordChipsProps {
  keywords: string[];
  technique?: ArtisticTechnique | null;
}

export function ExerciseKeywordChips({
  keywords,
  technique,
}: ExerciseKeywordChipsProps) {
  const { t } = useTranslation("ritual");

  if (keywords.length === 0) return null;

  const techniqueLabel = technique
    ? localizedTechniqueLabel(technique)
    : null;

  return (
    <View className="mb-4">
      <Text className="text-sand-600 text-xs uppercase tracking-wider mb-2">
        {t("keywords.title")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {keywords.map((word) => {
          const isTechnique =
            techniqueLabel &&
            word.toLowerCase() === techniqueLabel.toLowerCase();

          return (
            <View
              key={word}
              className={
                isTechnique
                  ? "bg-clay-400 rounded-full px-4 py-2 border border-clay-500/30"
                  : "bg-sage-500 rounded-full px-4 py-2 border border-sage-600/20"
              }
            >
              <Text
                className={`text-sm font-medium tracking-wide ${
                  isTechnique ? "text-white" : "text-white"
                }`}
              >
                {isTechnique ? t("keywords.techniquePrefix", { word }) : word}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
