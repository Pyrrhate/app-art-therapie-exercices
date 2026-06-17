import { Pressable, Text, View } from "react-native";
import type { EmotionQuadrant, EmotionQuadrantId } from "@/lib/emotion-explorer";

interface QuadrantPickerProps {
  quadrants: EmotionQuadrant[];
  onSelect: (quadrant: EmotionQuadrant) => void;
}

const GRID_ORDER: EmotionQuadrantId[][] = [
  ["high_unpleasant", "high_pleasant"],
  ["low_unpleasant", "low_pleasant"],
];

function QuadrantBlob({
  quadrant,
  onPress,
}: {
  quadrant: EmotionQuadrant;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={quadrant.title}
      className="flex-1 aspect-square active:opacity-90"
      style={{ maxWidth: "48%" }}
    >
      <View
        className="flex-1 rounded-full items-center justify-center px-3 py-4 m-1"
        style={{ backgroundColor: quadrant.color }}
      >
        <Text className="text-sand-900 text-xs uppercase tracking-wider text-center opacity-80 mb-1">
          {quadrant.energyLabel}
        </Text>
        <Text className="text-sand-900 text-sm font-medium text-center leading-5">
          {quadrant.valenceLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function QuadrantPicker({ quadrants, onSelect }: QuadrantPickerProps) {
  const byId = Object.fromEntries(quadrants.map((q) => [q.id, q])) as Record<
    EmotionQuadrantId,
    EmotionQuadrant
  >;

  return (
    <View>
      <Text className="text-sand-600 text-base text-center leading-6 mb-6 px-2">
        Touchez la teinte qui correspond le mieux à ce que vous ressentez en ce
        moment.
      </Text>
      <View className="gap-2">
        {GRID_ORDER.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-center gap-2">
            {row.map((id) => {
              const quadrant = byId[id];
              if (!quadrant) return null;
              return (
                <QuadrantBlob
                  key={id}
                  quadrant={quadrant}
                  onPress={() => onSelect(quadrant)}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
