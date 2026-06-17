import { Platform, Pressable, Text, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import type { ArtisticTechnique } from "@/lib/types";

interface TechniquePickerProps {
  selected: ArtisticTechnique | null;
  onSelect: (technique: ArtisticTechnique) => void;
  techniques: {
    id: ArtisticTechnique;
    label: string;
    emoji: string;
  }[];
}

export function TechniquePicker({
  selected,
  onSelect,
  techniques,
}: TechniquePickerProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {techniques.map((tech) => {
        const isSelected = selected === tech.id;
        const card = (
          <View
            className={`rounded-2xl px-4 py-3 min-h-[72px] min-w-[100px] border justify-center ${
              isSelected
                ? "bg-sage-500 border-sage-500"
                : "bg-white border-sand-200"
            }`}
            style={
              Platform.OS === "web" && !isSelected
                ? ({ boxShadow: "0 2px 8px rgba(62, 52, 44, 0.06)" } as const)
                : undefined
            }
          >
            <Text className="text-lg mb-1">{tech.emoji}</Text>
            <Text
              className={`text-sm ${isSelected ? "text-white" : "text-sand-700"}`}
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
          >
            {card}
          </Pressable>
        );
      })}
    </View>
  );
}
