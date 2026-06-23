import { Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
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
        <Card variant="content" className="p-4 rounded-2xl border-dashed">
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
            Envie d&apos;aller plus loin ?{" "}
            <Text className={`font-medium ${textPrimary(isDark)}`}>
              Passez en mode approfondi
            </Text>{" "}
            pour ancrer votre ressenti.
          </Text>
        </Card>
      </Pressable>
    </View>
  );
}
