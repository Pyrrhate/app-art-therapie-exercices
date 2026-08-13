import { Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import type { ExperienceMode } from "@/lib/experience/types";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const DEPTH_MODES: { id: ExperienceMode; keyPrefix: string; icon: string }[] = [
  { id: "express", keyPrefix: "custom.depthExpress", icon: "→" },
  { id: "deep", keyPrefix: "custom.depthDeep", icon: "◎" },
];

interface CustomDepthSelectorProps {
  value: ExperienceMode;
  onChange: (mode: ExperienceMode) => void;
}

export function CustomDepthSelector({
  value,
  onChange,
}: CustomDepthSelectorProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t("custom.depthA11y")}
      className="gap-3"
    >
      <Text className={`text-sm font-medium mb-1 ${textPrimary(isDark)}`}>
        {t("custom.depthTitle")}
      </Text>

      <View className="flex-row gap-3">
        {DEPTH_MODES.map((mode) => {
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
              className="flex-1 active:opacity-90 focus:opacity-90"
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
