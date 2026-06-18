import { Pressable, Text, View } from "react-native";
import type { ThemePreference } from "@/lib/preferences";
import { panelBg, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface ThemePickerProps {
  selected: ThemePreference;
  onSelect: (theme: ThemePreference) => void;
}

const OPTIONS: { id: ThemePreference; label: string; hint: string }[] = [
  { id: "light", label: "Clair", hint: "Sable & sauge" },
  { id: "dark", label: "Sombre", hint: "Reposant le soir" },
];

export function ThemePicker({ selected, onSelect }: ThemePickerProps) {
  const isDark = useIsDark();

  return (
    <View className="flex-row gap-3">
      {OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={`flex-1 rounded-2xl px-3 py-3 border items-center min-h-[72px] justify-center ${
              isSelected
                ? "bg-sage-500 border-sage-500"
                : panelBg(isDark)
            }`}
          >
            <Text
              className={`text-base font-medium mb-0.5 ${
                isSelected ? "text-white" : textPrimary(isDark)
              }`}
            >
              {option.label}
            </Text>
            <Text
              className={`text-xs text-center ${
                isSelected ? "text-white/80" : textSecondary(isDark)
              }`}
            >
              {option.hint}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
