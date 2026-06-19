import { Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { ModuleIcon, type ModuleIconId } from "@/components/ui/ModuleIcon";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ModuleIconId;
  route: "/ping-pong" | "/color-journey" | "/nuance-finder" | "/emotion-explorer";
}

export function ModuleCard({ title, description, icon, route }: ModuleCardProps) {
  const isDark = useIsDark();

  const card = (
    <View
      className={`rounded-3xl p-6 flex-1 min-h-[210px] justify-between ${
        isDark ? "bg-sand-800 border border-sand-700" : "bg-white border border-sand-100"
      }`}
      style={
        Platform.OS === "web" && !isDark
          ? ({ boxShadow: "0 2px 20px rgba(73, 99, 73, 0.06)" } as const)
          : undefined
      }
    >
      <View>
        <ModuleIcon id={icon} />
        <Text
          className={`font-display text-xl mb-2 ${textPrimary(isDark)}`}
          style={{ letterSpacing: -0.3 }}
        >
          {title}
        </Text>
        <Text className={`text-sm leading-6 ${textMuted(isDark)}`}>
          {description}
        </Text>
      </View>
      <Text className={`text-sm font-medium mt-5 ${textPrimary(isDark)}`}>
        Commencer →
      </Text>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <HoverScale
        onPress={() => router.push(route)}
        hoverScale={1.015}
        style={{ flex: 1, minWidth: "46%", maxWidth: "50%" }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {card}
      </HoverScale>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={{ flex: 1, minWidth: "46%", maxWidth: "50%" }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {card}
    </Pressable>
  );
}
