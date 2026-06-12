import { Pressable, Text, View } from "react-native";
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
        return (
          <Pressable
            key={tech.id}
            onPress={() => onSelect(tech.id)}
            className={`rounded-2xl px-4 py-3 border ${
              isSelected
                ? "bg-sage-500 border-sage-500"
                : "bg-white border-sand-200"
            }`}
          >
            <Text className="text-lg mb-1">{tech.emoji}</Text>
            <Text
              className={`text-sm ${isSelected ? "text-white" : "text-sand-700"}`}
            >
              {tech.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
