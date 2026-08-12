import { Pressable, Text, View } from "react-native";
import type { ThemePreference } from "@/lib/preferences";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface ThemePickerProps {
  selected: ThemePreference;
  onSelect: (theme: ThemePreference) => void;
}

const OPTIONS: {
  id: ThemePreference;
  label: string;
  hint: string;
  previewBg: string;
  previewBorder: string;
  swatches: string[];
}[] = [
  {
    id: "light",
    label: "Clair",
    hint: "Crème & pastèque",
    previewBg: "bg-sand-50",
    previewBorder: "border-sand-200",
    swatches: ["bg-melon-500", "bg-sage-500", "bg-clay-400"],
  },
  {
    id: "dark",
    label: "Foncé",
    hint: "Écorce & menthe",
    previewBg: "bg-sage-900",
    previewBorder: "border-sage-700",
    swatches: ["bg-mint-100", "bg-melon-400", "bg-sage-500"],
  },
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
            className={`flex-1 rounded-2xl overflow-hidden border-2 min-h-[118px] ${
              isSelected
                ? "border-melon-500"
                : isDark
                  ? "border-sand-700"
                  : "border-sand-200"
            }`}
          >
            <View
              className={`${option.previewBg} ${option.previewBorder} border-b px-3 pt-3 pb-4`}
            >
              <View className="flex-row gap-1.5 mb-3">
                {option.swatches.map((swatch) => (
                  <View
                    key={swatch}
                    className={`w-4 h-4 rounded-full ${swatch}`}
                  />
                ))}
              </View>
              <View
                className={`h-2 rounded-full mb-1.5 ${
                  option.id === "light" ? "bg-sand-200" : "bg-sage-700"
                }`}
                style={{ width: "80%" }}
              />
              <View
                className={`h-2 rounded-full ${
                  option.id === "light" ? "bg-sand-100" : "bg-sage-800"
                }`}
                style={{ width: "60%" }}
              />
            </View>
            <View
              className={`px-3 py-2.5 ${
                isSelected
                  ? "bg-melon-500"
                  : isDark
                    ? "bg-sand-800"
                    : "bg-white"
              }`}
            >
              <Text
                className={`text-sm font-semibold mb-0.5 ${
                  isSelected ? "text-white" : textPrimary(isDark)
                }`}
              >
                {option.label}
              </Text>
              <Text
                className={`text-[11px] ${
                  isSelected ? "text-white/85" : textSecondary(isDark)
                }`}
              >
                {option.hint}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
