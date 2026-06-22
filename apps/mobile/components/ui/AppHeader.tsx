import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AppHeaderProps {
  compact?: boolean;
  onNavigateTraces?: () => void;
}

export function AppHeader({ compact = false, onNavigateTraces }: AppHeaderProps) {
  const isDark = useIsDark();

  return (
    <View
      className={`flex-row items-center justify-between pt-1 ${
        compact ? "mb-4" : "mb-10"
      }`}
    >
      <View className="flex-row items-center gap-2.5">
        <View className="w-9 h-9 rounded-full bg-sage-500 items-center justify-center">
          <Text className="text-white font-display text-lg leading-none">p</Text>
        </View>
        <Text className={`font-display text-lg ${textPrimary(isDark)}`}>
          Pastek Art
        </Text>
      </View>

      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={onNavigateTraces ?? (() => router.push("/fil"))}
          hitSlop={8}
        >
          <Text className={`text-sm ${textMuted(isDark)}`}>Fil</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
          <Text className={`text-sm ${textMuted(isDark)}`}>Réglages</Text>
        </Pressable>
      </View>
    </View>
  );
}
