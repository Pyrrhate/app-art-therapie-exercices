import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { DonateRow } from "@/components/ui/DonateRow";
import { navigateSiteHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AppHeaderProps {
  compact?: boolean;
  onNavigateTraces?: () => void;
}

export function AppHeader({ compact = false, onNavigateTraces }: AppHeaderProps) {
  const isDark = useIsDark();

  return (
    <View className={compact ? "mb-4" : "mb-10"}>
      <DonateRow />
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={navigateSiteHome}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
          className="flex-row items-center gap-2.5 shrink min-w-0"
        >
          <View className="w-9 h-9 rounded-full bg-sage-500 items-center justify-center">
            <Text className="text-white font-display text-lg leading-none">p</Text>
          </View>
          <Text className={`font-display text-lg ${textPrimary(isDark)}`} numberOfLines={1}>
            Pastek Art
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-3 shrink-0">
          <Pressable
            onPress={onNavigateTraces ?? (() => router.push(ROUTES.fil))}
            hitSlop={8}
          >
            <Text className={`text-sm ${textMuted(isDark)}`}>Fil</Text>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.settings)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Réglages</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
