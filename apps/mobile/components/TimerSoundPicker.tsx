import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { TimerSoundId } from "@/lib/sounds";

const OPTIONS: {
  id: TimerSoundId;
  labelKey: "settings.soundGong" | "settings.soundChime" | "settings.soundNone";
}[] = [
  { id: "gong", labelKey: "settings.soundGong" },
  { id: "chime", labelKey: "settings.soundChime" },
  { id: "none", labelKey: "settings.soundNone" },
];

interface TimerSoundPickerProps {
  selected: TimerSoundId;
  onSelect: (id: TimerSoundId) => void;
}

export function TimerSoundPicker({ selected, onSelect }: TimerSoundPickerProps) {
  const { t } = useTranslation("app");

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
              {t(opt.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
