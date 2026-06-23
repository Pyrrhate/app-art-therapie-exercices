import { Text, View } from "react-native";
import { ZenWaitIndicator } from "@/components/ZenWaitIndicator";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AnalysisLoadingStateProps {
  message?: string;
}

/** État de chargement pendant l'analyse croisée par l'art-thérapeute virtuel. */
export function AnalysisLoadingState({
  message = "Votre art-thérapeute virtuel croise votre ressenti et votre création…",
}: AnalysisLoadingStateProps) {
  const isDark = useIsDark();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      className="items-center justify-center py-12 gap-6"
    >
      <ZenWaitIndicator />
      <Text className={`text-base text-center leading-7 px-4 ${textSecondary(isDark)}`}>
        {message}
      </Text>
      <Text className={`text-xs text-center px-6 ${textMuted(isDark)}`}>
        Croisement de la consigne, de vos mots et du média — sans diagnostic, en
        douceur.
      </Text>
    </View>
  );
}
