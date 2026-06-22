import { Platform, Pressable, Text, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { PastekIcon } from "@/components/ui/ModuleIcon";
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
    <View className="flex-row flex-wrap gap-2">
      {techniques.map((tech) => {
        const isSelected = selected === tech.id;
        const card = (
          <View
            className={`rounded-xl px-3 py-2 min-h-[68px] min-w-[92px] border justify-center ${
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
            <PastekIcon
              id={tech.id}
              boxSize={28}
              size={18}
              className="mb-0.5"
              tone={isSelected ? "light" : "default"}
            />
            <Text
              className={`text-xs ${
                isSelected ? "text-white" : textPrimary(isDark)
              }`}
            >
              {tech.label}
            </Text>
          </View>
        );

        if (Platform.OS === "web") {
          return (
            <HoverScale
              key={tech.id}
              onPress={() => onSelect(tech.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={tech.label}
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
            accessibilityLabel={tech.label}
          >
            {card}
          </Pressable>
        );
      })}
    </View>
  );
}
