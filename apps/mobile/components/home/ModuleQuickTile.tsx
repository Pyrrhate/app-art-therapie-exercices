import { Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { PastekIcon, type ModuleIconId } from "@/components/ui/ModuleIcon";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface ModuleQuickTileProps {
  title: string;
  description: string;
  icon: ModuleIconId;
  route: "/ping-pong" | "/color-journey" | "/nuance-finder" | "/emotion-explorer";
}

export function ModuleQuickTile({
  title,
  description,
  icon,
  route,
}: ModuleQuickTileProps) {
  const isDark = useIsDark();

  const tile = (
    <View
      className={`rounded-2xl px-4 py-4 flex-row items-start gap-4 border ${
        isDark ? "bg-sand-800 border-sand-700" : "bg-white border-sand-100"
      }`}
      style={
        Platform.OS === "web" && !isDark
          ? ({ boxShadow: "0 1px 12px rgba(73, 99, 73, 0.06)" } as const)
          : undefined
      }
    >
      <PastekIcon id={icon} boxSize={48} size={30} className="mb-0 shrink-0 mt-0.5" />
      <View className="flex-1 min-w-0 pr-1">
        <Text
          className={`font-display text-lg leading-snug ${textPrimary(isDark)}`}
          style={{ letterSpacing: -0.3 }}
        >
          {title}
        </Text>
        <Text
          className={`text-sm leading-5 mt-1.5 ${textMuted(isDark)}`}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>
      <Text className={`text-sage-500 text-lg mt-1 shrink-0 ${textMuted(isDark)}`}>
        →
      </Text>
    </View>
  );

  const fullWidthStyle = { width: "100%" as const };

  if (Platform.OS === "web") {
    return (
      <HoverScale
        onPress={() => router.push(route)}
        hoverScale={1.01}
        style={fullWidthStyle}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}`}
      >
        {tile}
      </HoverScale>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={fullWidthStyle}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      {tile}
    </Pressable>
  );
}
