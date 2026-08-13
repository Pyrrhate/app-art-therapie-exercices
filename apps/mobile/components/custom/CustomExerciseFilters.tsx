import { Platform, Pressable, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
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

const TAG_PADDING: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 10,
};

interface FilterGroupProps {
  label: string;
  accessibilityLabel: string;
  options: readonly { id: string; label: string }[];
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
          const { id, label: displayLabel } = option;
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
                className={`rounded-full border ${
                  isSelected
                    ? "bg-sage-500 border-sage-500"
                    : `${panelBg(isDark)} border-sand-200`
                } ${isDark && !isSelected ? "border-sand-600" : ""}`}
                style={[
                  TAG_PADDING,
                  Platform.OS === "web" && !isSelected
                    ? { boxShadow: "0 1px 4px rgba(62, 52, 44, 0.06)" }
                    : null,
                ]}
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
  const { t } = useTranslation("ritual");

  /** Les valeurs stockées restent en français (envoyées à l'IA) ; seul l'affichage est traduit. */
  const localizedOptions = (options: readonly string[]) =>
    options.map((option) => ({
      id: option,
      label: t(`custom.options.${option}`, { defaultValue: option }),
    }));

  const techniqueCategories = CUSTOM_TECHNIQUE_CATEGORIES.map((category) => ({
    id: category.id,
    label: t(`custom.techniqueCategories.${category.id}`, {
      defaultValue: category.label,
    }),
  }));

  return (
    <View>
      <Text className={`text-xs uppercase tracking-[0.16em] font-medium mb-4 ${textMuted(isDark)}`}>
        {t("custom.filtersTitle")}
      </Text>

      <FilterGroup
        label={t("custom.themeLabel")}
        accessibilityLabel={t("custom.themeA11y")}
        options={localizedOptions(CUSTOM_THEMES)}
        selected={value.theme}
        onSelect={(theme) => onChange({ theme })}
      />

      <FilterGroup
        label={t("custom.emotionLabel")}
        accessibilityLabel={t("custom.emotionA11y")}
        options={localizedOptions(CUSTOM_EMOTIONS)}
        selected={value.emotion}
        onSelect={(emotion) => onChange({ emotion })}
      />

      <FilterGroup
        label={t("custom.goalLabel")}
        accessibilityLabel={t("custom.goalA11y")}
        options={localizedOptions(CUSTOM_GOALS)}
        selected={value.goal}
        onSelect={(goal) => onChange({ goal })}
      />

      <FilterGroup
        label={t("custom.techniqueLabel")}
        accessibilityLabel={t("custom.techniqueA11y")}
        options={techniqueCategories}
        selected={value.technique}
        onSelect={(technique) => onChange({ technique })}
      />
    </View>
  );
}
