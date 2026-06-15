import { Platform, Pressable, Text, View } from "react-native";
import { MANDALA_COLORS } from "@/lib/mandala/palette";

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const HUE_STOPS = Array.from({ length: 24 }, (_, i) => i * 15);

interface SpectrumColorPickerProps {
  selected: string;
  onSelect: (hex: string) => void;
}

export function SpectrumColorPicker({
  selected,
  onSelect,
}: SpectrumColorPickerProps) {
  return (
    <View className="gap-4">
      <Text className="text-sand-600 text-sm font-medium text-center">
        Palette apaisante
      </Text>
      <View className="flex-row flex-wrap justify-center gap-3 px-2">
        {MANDALA_COLORS.map((color) => {
          const isSelected = selected === color.hex;
          return (
            <Pressable
              key={color.id}
              onPress={() => onSelect(color.hex)}
              accessibilityLabel={color.label}
              className={`rounded-full border-2 ${isSelected ? "border-sage-500" : "border-sand-200"}`}
              style={{ width: 36, height: 36, backgroundColor: color.hex }}
            />
          );
        })}
      </View>

      <Text className="text-sand-600 text-sm font-medium text-center mt-2">
        Tout le spectre
      </Text>
      <View className="flex-row flex-wrap justify-center gap-2 px-1">
        {HUE_STOPS.map((hue) => {
          const hex = hslToHex(hue, 52, 58);
          const isSelected = selected.toLowerCase() === hex.toLowerCase();
          return (
            <Pressable
              key={hue}
              onPress={() => onSelect(hex)}
              className={`rounded-lg border ${isSelected ? "border-sage-500 border-2" : "border-sand-200"}`}
              style={{ width: 28, height: 28, backgroundColor: hex }}
            />
          );
        })}
      </View>

      <View className="flex-row flex-wrap justify-center gap-2 px-1">
        {HUE_STOPS.map((hue) => {
          const hex = hslToHex(hue, 38, 72);
          const isSelected = selected.toLowerCase() === hex.toLowerCase();
          return (
            <Pressable
              key={`pastel-${hue}`}
              onPress={() => onSelect(hex)}
              className={`rounded-lg border ${isSelected ? "border-sage-500 border-2" : "border-sand-200"}`}
              style={{ width: 28, height: 28, backgroundColor: hex }}
            />
          );
        })}
      </View>

      {Platform.OS === "web" && (
        <View className="items-center mt-2">
          <Text className="text-sand-500 text-xs mb-2">Couleur libre</Text>
          <input
            type="color"
            value={selected.startsWith("#") ? selected : "#6B8F71"}
            onChange={(e) => onSelect(e.target.value)}
            style={{
              width: 48,
              height: 48,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              backgroundColor: "transparent",
            }}
          />
        </View>
      )}

      <View className="flex-row items-center justify-center gap-2 mt-1">
        <View
          className="rounded-xl border border-sand-300"
          style={{ width: 32, height: 32, backgroundColor: selected }}
        />
        <Text className="text-sand-500 text-xs">{selected.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export { hslToHex };
