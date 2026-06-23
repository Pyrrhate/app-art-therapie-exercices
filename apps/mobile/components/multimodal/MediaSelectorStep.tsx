import { Platform, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import {
  MEDIA_TYPE_CONFIG,
  MEDIA_TYPE_ORDER,
} from "@/lib/multimodal/mediaConfig";
import type { ExpressionMediaType } from "@/lib/multimodal/types";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface MediaSelectorStepProps {
  selected: ExpressionMediaType | null;
  onSelect: (type: ExpressionMediaType) => void;
}

export function MediaSelectorStep({ selected, onSelect }: MediaSelectorStepProps) {
  const isDark = useIsDark();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Choisir un type d'expression"
      className="gap-4"
    >
      <Text className={`text-base leading-7 mb-2 ${textSecondary(isDark)}`}>
        Comment souhaitez-vous exprimer ce que vous venez de vivre ? Choisissez le
        canal qui correspond le mieux à votre création.
      </Text>

      {MEDIA_TYPE_ORDER.map((type) => {
        const config = MEDIA_TYPE_CONFIG[type];
        const isSelected = selected === type;

        return (
          <Pressable
            key={type}
            onPress={() => onSelect(type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${config.title} — ${config.subtitle}`}
            className="active:opacity-90"
          >
            <Card
              variant={isSelected ? "accent" : "content"}
              className={`p-5 rounded-2xl ${
                isSelected ? "border-sage-400" : ""
              } ${Platform.OS === "web" ? "web:transition-colors web:duration-200" : ""}`}
            >
              <View className="flex-row items-start gap-4">
                <Text
                  accessibilityLabel={config.iconLabel}
                  className="text-sage-500 text-3xl leading-none mt-0.5"
                >
                  {config.icon}
                </Text>
                <View className="flex-1 gap-1">
                  <Text className={`font-semibold text-base ${textPrimary(isDark)}`}>
                    {config.title}
                  </Text>
                  <Text className={`text-sm ${textSecondary(isDark)}`}>
                    {config.subtitle}
                  </Text>
                  <Text className={`text-xs mt-1 ${textMuted(isDark)}`}>
                    {config.examples}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
