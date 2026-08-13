import { Pressable, Text } from "react-native";
import { useIsDark } from "@/lib/themeStore";
import { textMuted } from "@/lib/themeClasses";

export function FilTagChip({
  label,
  active = false,
  onPress,
  compact = false,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  const isDark = useIsDark();
  const padding = compact ? "px-2 py-0.5" : "px-3 py-1.5";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={label}
      className={`rounded-full border ${padding} ${
        active
          ? "bg-sage-500 border-sage-500"
          : isDark
            ? "border-sand-600 bg-sand-900/50"
            : "border-sand-200 bg-sand-50/90"
      }`}
    >
      <Text
        className={`text-[11px] ${
          active ? "text-white font-medium" : textMuted(isDark)
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
