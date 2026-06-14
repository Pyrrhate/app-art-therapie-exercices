import { Pressable, Text, View } from "react-native";
import type { TimerSoundId } from "@/lib/sounds";

const OPTIONS: { id: TimerSoundId; label: string }[] = [
  { id: "gong", label: "Gong" },
  { id: "chime", label: "Carillon" },
  { id: "none", label: "Silencieux" },
];

interface TimerSoundPickerProps {
  selected: TimerSoundId;
  onSelect: (id: TimerSoundId) => void;
}

export function TimerSoundPicker({ selected, onSelect }: TimerSoundPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            className={`rounded-2xl px-4 py-3 border ${
              isSelected
                ? "bg-sage-500 border-sage-500"
                : "bg-white border-sand-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected ? "text-white" : "text-sand-700"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
