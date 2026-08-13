import { Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import type { ExperienceMode } from "@/lib/experience/types";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const MODES: { id: ExperienceMode; keyPrefix: string; icon: string }[] = [
  { id: "express", keyPrefix: "experienceMode.express", icon: "→" },
  { id: "deep", keyPrefix: "experienceMode.deep", icon: "◎" },
];

interface ExperienceModeSelectorProps {
  value: ExperienceMode;
  onChange: (mode: ExperienceMode) => void;
}

export function ExperienceModeSelector({
  value,
  onChange,
}: ExperienceModeSelectorProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t("experienceMode.a11y")}
      className="gap-3 mb-6"
    >
      <Text className={`text-sm font-medium mb-1 ${textPrimary(isDark)}`}>
        {t("experienceMode.title")}
      </Text>

      <View className="flex-row gap-3">
        {MODES.map((mode) => {
          const selected = value === mode.id;
          const title = t(`${mode.keyPrefix}.title`);
          const subtitle = t(`${mode.keyPrefix}.subtitle`);
          const description = t(`${mode.keyPrefix}.description`);
          return (
            <Pressable
              key={mode.id}
              onPress={() => onChange(mode.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${title} — ${description}`}
              className="flex-1 active:opacity-90"
            >
              <Card
                variant={selected ? "accent" : "content"}
                className={`p-4 rounded-2xl min-h-[148px] justify-between ${
                  Platform.OS === "web" ? "web:transition-colors web:duration-200" : ""
                }`}
              >
                <Text className="text-sage-500 text-xl mb-2">{mode.icon}</Text>
                <Text className={`font-semibold text-sm ${textPrimary(isDark)}`}>
                  {title}
                </Text>
                <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`}>
                  {subtitle}
                </Text>
                <Text className={`text-xs mt-2 leading-5 ${textSecondary(isDark)}`}>
                  {description}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
