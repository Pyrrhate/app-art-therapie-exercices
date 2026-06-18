import { Platform, Pressable, Text, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import type { TechniqueDefinition } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";
import { panelBg, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface TechniquePickerProps {
  selected: ArtisticTechnique | null;
  onSelect: (technique: ArtisticTechnique) => void;
  techniques: TechniqueDefinition[];
}

export function TechniquePicker({
  selected,
  onSelect,
  techniques,
}: TechniquePickerProps) {
  const isDark = useIsDark();

  return (
    <View className="flex-row flex-wrap gap-3">
      {techniques.map((tech) => {
        const isSelected = selected === tech.id;
        const card = (
          <View
            className={`rounded-2xl px-4 py-3 min-h-[80px] min-w-[100px] border justify-center ${
              isSelected
                ? "bg-sage-500 border-sage-500"
                : panelBg(isDark)
            }`}
            style={
              Platform.OS === "web" && !isSelected
                ? ({ boxShadow: "0 2px 8px rgba(62, 52, 44, 0.06)" } as const)
                : undefined
            }
          >
            <Text className="text-lg mb-1">{tech.emoji}</Text>
            <Text
              className={`text-sm ${
                isSelected ? "text-white" : textPrimary(isDark)
              }`}
            >
              {tech.label}
            </Text>
            {!tech.aiAnalysis && (
              <Text
                className={`text-[10px] mt-1 leading-3 ${
                  isSelected ? "text-white/80" : "text-amber-600"
                }`}
              >
                Sans analyse IA
              </Text>
            )}
          </View>
        );

        if (Platform.OS === "web") {
          return (
            <HoverScale
              key={tech.id}
              onPress={() => onSelect(tech.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={
                tech.aiAnalysis
                  ? tech.label
                  : `${tech.label}, sans analyse IA`
              }
              hoverScale={1.03}
            >
              {card}
            </HoverScale>
          );
        }

        return (
          <Pressable
            key={tech.id}
            onPress={() => onSelect(tech.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={
              tech.aiAnalysis ? tech.label : `${tech.label}, sans analyse IA`
            }
          >
            {card}
          </Pressable>
        );
      })}
    </View>
  );
}
