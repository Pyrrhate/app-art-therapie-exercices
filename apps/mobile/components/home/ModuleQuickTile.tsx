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

const tileShellStyle = {
  flexGrow: 1,
  flexBasis: "48%" as const,
  maxWidth: "49%" as const,
  minWidth: 148,
};

export function ModuleQuickTile({
  title,
  description,
  icon,
  route,
}: ModuleQuickTileProps) {
  const isDark = useIsDark();

  const tile = (
    <View
      className={`rounded-2xl p-3.5 min-h-[152px] justify-between border ${
        isDark ? "bg-sand-800 border-sand-700" : "bg-white border-sand-100"
      }`}
      style={
        Platform.OS === "web" && !isDark
          ? ({ boxShadow: "0 1px 12px rgba(73, 99, 73, 0.06)" } as const)
          : undefined
      }
    >
      <View>
        <PastekIcon id={icon} boxSize={44} size={28} className="mb-2" />
        <Text
          className={`font-display text-[15px] leading-5 ${textPrimary(isDark)}`}
          style={{ letterSpacing: -0.25 }}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          className={`text-xs leading-[17px] mt-1.5 ${textMuted(isDark)}`}
          numberOfLines={3}
        >
          {description}
        </Text>
      </View>
      <Text className={`text-xs font-medium mt-2 ${textPrimary(isDark)}`}>
        Commencer →
      </Text>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <HoverScale
        onPress={() => router.push(route)}
        hoverScale={1.02}
        style={tileShellStyle}
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
      style={tileShellStyle}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      {tile}
    </Pressable>
  );
}
