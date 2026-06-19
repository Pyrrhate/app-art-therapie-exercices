import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AppHeaderProps {
  onNavigateAmorces?: () => void;
  onNavigateTraces?: () => void;
}

export function AppHeader({ onNavigateAmorces, onNavigateTraces }: AppHeaderProps) {
  const isDark = useIsDark();

  return (
    <View className="flex-row items-center justify-between mb-10 pt-2">
      <View className="flex-row items-center gap-2.5">
        <View className="w-9 h-9 rounded-full bg-sage-500 items-center justify-center">
          <Text className="text-white font-display text-lg leading-none">p</Text>
        </View>
        <Text className={`font-display text-lg ${textPrimary(isDark)}`}>
          Pastek Art
        </Text>
      </View>

      <View className="flex-row items-center gap-5">
        {onNavigateAmorces ? (
          <Pressable onPress={onNavigateAmorces} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Amorces</Text>
          </Pressable>
        ) : null}
        {onNavigateTraces ? (
          <Pressable onPress={onNavigateTraces} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Vos traces</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push("/fil")} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Vos traces</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
