import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ZenWaitIndicator } from "@/components/ZenWaitIndicator";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AnalysisLoadingStateProps {
  message?: string;
}

/** État de chargement pendant l'analyse croisée par le miroir créatif. */
export function AnalysisLoadingState({ message }: AnalysisLoadingStateProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");
  const resolvedMessage = message ?? t("multimodal.analysisMessage");

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedMessage}
      className="items-center justify-center py-12 gap-6"
    >
      <ZenWaitIndicator active />
      <Text className={`text-base text-center leading-7 px-4 ${textSecondary(isDark)}`}>
        {resolvedMessage}
      </Text>
      <Text className={`text-xs text-center px-6 ${textMuted(isDark)}`}>
        {t("multimodal.analysisHint")}
      </Text>
    </View>
  );
}
