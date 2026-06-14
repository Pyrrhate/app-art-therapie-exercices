import { Pressable, View } from "react-native";
import { MANDALA_COLORS } from "@/lib/mandala/palette";

interface ColorPaletteProps {
  selected: string;
  onSelect: (hex: string) => void;
}

export function ColorPalette({ selected, onSelect }: ColorPaletteProps) {
  return (
    <View className="flex-row flex-wrap justify-center gap-3 px-2 py-3">
      {MANDALA_COLORS.map((color) => {
        const isSelected = selected === color.hex;
        return (
          <Pressable
            key={color.id}
            onPress={() => onSelect(color.hex)}
            accessibilityLabel={color.label}
            className={`rounded-full border-2 ${isSelected ? "border-sage-500" : "border-sand-200"}`}
            style={{
              width: 36,
              height: 36,
              backgroundColor: color.hex,
            }}
          />
        );
      })}
    </View>
  );
}
