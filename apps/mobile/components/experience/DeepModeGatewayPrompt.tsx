import { Platform, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface DeepModeGatewayPromptProps {
  onUpgrade: () => void;
}

/** Incitation discrète pour passer du mode express au mode profond avant l'analyse. */
export function DeepModeGatewayPrompt({ onUpgrade }: DeepModeGatewayPromptProps) {
  const isDark = useIsDark();

  return (
    <View className="mb-4">
      <Pressable
        onPress={onUpgrade}
        accessibilityRole="button"
        accessibilityLabel="Passer en mode approfondi pour ancrer votre ressenti"
        className="active:opacity-90"
      >
        <Card
          variant="content"
          className={`p-4 rounded-2xl border-dashed flex-row justify-between items-center gap-3 ${
            Platform.OS === "web" ? "web:transition-opacity web:duration-200" : ""
          }`}
        >
          <View className="flex-1 shrink">
            <Text className={`text-sm font-medium mb-1 ${textPrimary(isDark)}`}>
              Envie d&apos;aller plus loin ?
            </Text>
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              Passez en mode approfondi pour ancrer votre ressenti avant le
              miroir créatif.
            </Text>
            <Text className={`text-xs mt-2 ${textMuted(isDark)}`}>
              Parcours guidé · ancrage puis intégration
            </Text>
          </View>
          <View className="bg-sage-500 rounded-full w-10 h-10 items-center justify-center shrink-0">
            <Text className="text-white text-lg font-medium">→</Text>
          </View>
        </Card>
      </Pressable>
    </View>
  );
}
