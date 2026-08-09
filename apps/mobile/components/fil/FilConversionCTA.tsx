import { Platform, Pressable, Text, View } from "react-native";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface FilConversionCTAProps {
  onPress: () => void;
}

export function FilConversionCTA({ onPress }: FilConversionCTAProps) {
  const isDark = useIsDark();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`rounded-3xl border overflow-hidden ${
        isDark
          ? "border-sage-600/40 bg-sage-700/20"
          : "border-sage-100 bg-sage-50"
      }`}
      style={
        Platform.OS === "web"
          ? ({ boxShadow: "0 2px 20px rgba(73, 99, 73, 0.06)" } as const)
          : undefined
      }
    >
      <View className="px-5 py-4">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-2 h-2 rounded-full bg-sage-400" />
          <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
            Sauvegarde cloud
          </Text>
        </View>
        <Text className={`text-base leading-6 mb-2 ${textPrimary(isDark)}`}>
          Vos créations sont actuellement stockées uniquement sur cet appareil.
        </Text>
        <Text className={`text-sm leading-6 mb-4 ${textSecondary(isDark)}`}>
          Créez un compte gratuit pour les sécuriser et connecter votre Drive
          personnel (Google, Microsoft…).
        </Text>
        <View className="self-start rounded-full bg-sage-500 px-5 py-2.5">
          <Text className="text-white text-sm font-semibold tracking-wide">
            Créer un compte gratuit →
          </Text>
        </View>
        <Text className={`text-xs mt-3 leading-5 ${textMuted(isDark)}`}>
          Connexion par email, Google ou Microsoft · sans engagement
        </Text>
      </View>
    </Pressable>
  );
}
