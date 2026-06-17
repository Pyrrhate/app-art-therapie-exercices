import { Text, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import type { EmotionQuadrant, EmotionQuadrantId } from "@/lib/emotion-explorer";

interface QuadrantPickerProps {
  quadrants: EmotionQuadrant[];
  onSelect: (quadrant: EmotionQuadrant) => void;
  /** Fond sombre sur la phase quadrant — textes plus clairs. */
  theme?: "light" | "dark";
}

const GRID_ORDER: EmotionQuadrantId[][] = [
  ["high_unpleasant", "high_pleasant"],
  ["low_unpleasant", "low_pleasant"],
];

const BOARD_SIZE = 300;
const CORNER_SIZE = 118;
const CENTER_SIZE = 92;

function QuadrantBlob({
  quadrant,
  onPress,
  size,
  compact = false,
}: {
  quadrant: EmotionQuadrant;
  onPress: () => void;
  size: number;
  compact?: boolean;
}) {
  return (
    <HoverScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={quadrant.title}
      hoverScale={1.06}
      style={{ width: size, height: size }}
    >
      <View
        className="flex-1 rounded-full items-center justify-center"
        style={{
          backgroundColor: quadrant.color,
          width: size,
          height: size,
          borderRadius: size / 2,
          paddingHorizontal: compact ? 6 : 10,
        }}
      >
        <Text
          className="text-sand-900 uppercase tracking-wider text-center opacity-80 mb-1"
          style={{ fontSize: compact ? 9 : 11 }}
        >
          {quadrant.energyLabel}
        </Text>
        <Text
          className="text-sand-900 font-medium text-center leading-4"
          style={{ fontSize: compact ? 11 : 13 }}
        >
          {quadrant.valenceLabel}
        </Text>
      </View>
    </HoverScale>
  );
}

export function QuadrantPicker({
  quadrants,
  onSelect,
  theme = "light",
}: QuadrantPickerProps) {
  const byId = Object.fromEntries(quadrants.map((q) => [q.id, q])) as Record<
    EmotionQuadrantId,
    EmotionQuadrant
  >;
  const neutral = byId.neutral;

  const subtitleClass =
    theme === "dark" ? "text-sand-300" : "text-sand-600";

  return (
    <View>
      <Text className={`${subtitleClass} text-base text-center leading-6 mb-6 px-2`}>
        Touchez la teinte qui correspond le mieux à ce que vous ressentez — ou
        le centre si c&apos;est incertain.
      </Text>

      <View
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          alignSelf: "center",
          position: "relative",
        }}
      >
        <View className="gap-2" style={{ flex: 1, justifyContent: "space-between" }}>
          {GRID_ORDER.map((row, rowIndex) => (
            <View
              key={rowIndex}
              className="flex-row justify-between"
              style={{ paddingHorizontal: 4 }}
            >
              {row.map((id) => {
                const quadrant = byId[id];
                if (!quadrant) return null;
                return (
                  <QuadrantBlob
                    key={id}
                    quadrant={quadrant}
                    onPress={() => onSelect(quadrant)}
                    size={CORNER_SIZE}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {neutral ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: (BOARD_SIZE - CENTER_SIZE) / 2,
              left: (BOARD_SIZE - CENTER_SIZE) / 2,
              zIndex: 10,
            }}
          >
            <QuadrantBlob
              quadrant={neutral}
              onPress={() => onSelect(neutral)}
              size={CENTER_SIZE}
              compact
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
