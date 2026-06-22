import { Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { PastekIcon, type ModuleIconId } from "@/components/ui/ModuleIcon";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface ModuleQuickTileProps {
  title: string;
  shortTitle: string;
  icon: ModuleIconId;
  route: "/ping-pong" | "/color-journey" | "/nuance-finder" | "/emotion-explorer";
}

export function ModuleQuickTile({
  title,
  shortTitle,
  icon,
  route,
}: ModuleQuickTileProps) {
  const isDark = useIsDark();

  const tile = (
    <View
      className={`rounded-2xl px-3 py-3 flex-row items-center gap-3 border ${
        isDark ? "bg-sand-800 border-sand-700" : "bg-white border-sand-100"
      }`}
      style={
        Platform.OS === "web" && !isDark
          ? ({ boxShadow: "0 1px 12px rgba(73, 99, 73, 0.06)" } as const)
          : undefined
      }
    >
      <PastekIcon id={icon} boxSize={40} size={26} className="mb-0 shrink-0" />
      <View className="flex-1 min-w-0">
        <Text
          className={`font-display text-base ${textPrimary(isDark)}`}
          style={{ letterSpacing: -0.2 }}
          numberOfLines={1}
        >
          {shortTitle}
        </Text>
        <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text className={`text-sage-500 text-sm ${textMuted(isDark)}`}>→</Text>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <HoverScale
        onPress={() => router.push(route)}
        hoverScale={1.02}
        style={{ flexGrow: 1, flexBasis: "47%", minWidth: 140 }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {tile}
      </HoverScale>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={{ flexGrow: 1, flexBasis: "47%", minWidth: 140 }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {tile}
    </Pressable>
  );
}
