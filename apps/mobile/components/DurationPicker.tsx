import { Pressable, Text, View } from "react-native";
import type { RitualDuration } from "@/constants";

interface DurationPickerProps {
  selected: RitualDuration;
  onSelect: (minutes: RitualDuration) => void;
  options?: readonly RitualDuration[];
}

export function DurationPicker({
  selected,
  onSelect,
  options = [15, 30, 45],
}: DurationPickerProps) {
  return (
    <View className="flex-row gap-3">
      {options.map((minutes) => {
        const isSelected = selected === minutes;
        return (
          <Pressable
            key={minutes}
            onPress={() => onSelect(minutes)}
            className={`flex-1 rounded-2xl px-3 py-3 border items-center ${
              isSelected
                ? "bg-sage-500 border-sage-500"
                : "bg-white border-sand-200"
            }`}
          >
            <Text
              className={`text-base font-medium ${
                isSelected ? "text-white" : "text-sand-700"
              }`}
            >
              {minutes} min
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
