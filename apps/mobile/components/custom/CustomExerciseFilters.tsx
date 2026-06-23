import { Platform, Pressable, Text, View } from "react-native";
import type { CustomSessionConfig } from "@/lib/custom/types";
import {
  CUSTOM_EMOTIONS,
  CUSTOM_GOALS,
  CUSTOM_TECHNIQUE_CATEGORIES,
  CUSTOM_THEMES,
} from "@/lib/custom/types";
import { panelBg, textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface CustomExerciseFiltersProps {
  value: CustomSessionConfig;
  onChange: (patch: Partial<CustomSessionConfig>) => void;
}

interface FilterGroupProps {
  label: string;
  accessibilityLabel: string;
  options: readonly string[] | { id: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function FilterGroup({
  label,
  accessibilityLabel,
  options,
  selected,
  onSelect,
}: FilterGroupProps) {
  const isDark = useIsDark();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="mb-5"
    >
      <Text className={`text-sm font-medium mb-2.5 ${textPrimary(isDark)}`}>
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const id = typeof option === "string" ? option : option.id;
          const displayLabel = typeof option === "string" ? option : option.label;
          const isSelected = selected === id;

          return (
            <Pressable
              key={id}
              onPress={() => onSelect(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={displayLabel}
              className="active:opacity-85"
            >
              <View
                className={`rounded-full px-3.5 py-2 border ${
                  isSelected
                    ? "bg-sage-500 border-sage-500"
                    : `${panelBg(isDark)} border-sand-200`
                } ${isDark && !isSelected ? "border-sand-600" : ""}`}
                style={
                  Platform.OS === "web" && !isSelected
                    ? ({ boxShadow: "0 1px 4px rgba(62, 52, 44, 0.06)" } as const)
                    : undefined
                }
              >
                <Text
                  className={`text-sm ${
                    isSelected ? "text-white font-medium" : textPrimary(isDark)
                  }`}
                >
                  {displayLabel}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CustomExerciseFilters({
  value,
  onChange,
}: CustomExerciseFiltersProps) {
  const isDark = useIsDark();

  return (
    <View>
      <Text className={`text-xs uppercase tracking-[0.16em] font-medium mb-4 ${textMuted(isDark)}`}>
        Vos critères
      </Text>

      <FilterGroup
        label="Thématique"
        accessibilityLabel="Choisir une thématique"
        options={CUSTOM_THEMES}
        selected={value.theme}
        onSelect={(theme) => onChange({ theme })}
      />

      <FilterGroup
        label="Spectre émotionnel"
        accessibilityLabel="Choisir une émotion"
        options={CUSTOM_EMOTIONS}
        selected={value.emotion}
        onSelect={(emotion) => onChange({ emotion })}
      />

      <FilterGroup
        label="Objectif thérapeutique"
        accessibilityLabel="Choisir un objectif thérapeutique"
        options={CUSTOM_GOALS}
        selected={value.goal}
        onSelect={(goal) => onChange({ goal })}
      />

      <FilterGroup
        label="Technique artistique"
        accessibilityLabel="Choisir une catégorie de technique artistique"
        options={CUSTOM_TECHNIQUE_CATEGORIES}
        selected={value.technique}
        onSelect={(technique) => onChange({ technique })}
      />
    </View>
  );
}
