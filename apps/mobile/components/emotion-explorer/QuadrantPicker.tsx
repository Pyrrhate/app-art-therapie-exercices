import { Text, useWindowDimensions, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import type { EmotionQuadrant, EmotionQuadrantId } from "@/lib/emotion-explorer";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface QuadrantPickerProps {
  quadrants: EmotionQuadrant[];
  onSelect: (quadrant: EmotionQuadrant) => void;
  fillHeight?: boolean;
}

const CORNER_LAYOUT: {
  id: EmotionQuadrantId;
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  innerRadius: {
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
  };
}[] = [
  {
    id: "high_unpleasant",
    position: "topLeft",
    innerRadius: { borderBottomRightRadius: 8 },
  },
  {
    id: "high_pleasant",
    position: "topRight",
    innerRadius: { borderBottomLeftRadius: 8 },
  },
  {
    id: "low_unpleasant",
    position: "bottomLeft",
    innerRadius: { borderTopRightRadius: 8 },
  },
  {
    id: "low_pleasant",
    position: "bottomRight",
    innerRadius: { borderTopLeftRadius: 8 },
  },
];

function QuadrantCell({
  quadrant,
  onPress,
  size,
  variant,
  innerRadius,
}: {
  quadrant: EmotionQuadrant;
  onPress: () => void;
  size: number;
  variant: "corner" | "neutral";
  innerRadius?: {
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
  };
}) {
  const isNeutral = variant === "neutral";

  const cell = isNeutral ? (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Polygon
          points="50,4 92,27 92,73 50,96 8,73 8,27"
          fill={quadrant.color}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1.5}
        />
      </Svg>
      <View
        className="absolute inset-0 items-center justify-center px-2"
        pointerEvents="none"
      >
        <Text
          className="text-white/90 uppercase text-center mb-0.5 font-medium"
          style={{ fontSize: 7, letterSpacing: 1, lineHeight: 10 }}
        >
          {quadrant.energyLabel}
        </Text>
        <Text
          className="font-display text-white text-center"
          style={{ fontSize: 12, lineHeight: 15, letterSpacing: -0.2 }}
        >
          {quadrant.valenceLabel}
        </Text>
      </View>
    </View>
  ) : (
    <View
      className="items-center justify-center border border-black/10"
      style={{
        backgroundColor: quadrant.color,
        width: size,
        height: size,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        ...innerRadius,
      }}
    >
      <Text
        className="text-white/90 uppercase text-center mb-1 font-medium"
        style={{
          fontSize: 9,
          letterSpacing: 1.1,
          lineHeight: 12,
        }}
      >
        {quadrant.energyLabel}
      </Text>
      <Text
        className="font-display text-white text-center"
        style={{
          fontSize: 16,
          lineHeight: 20,
          letterSpacing: -0.2,
        }}
      >
        {quadrant.valenceLabel}
      </Text>
    </View>
  );

  return (
    <HoverScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={quadrant.title}
      hoverScale={1.03}
      style={{ width: size, height: size }}
    >
      {cell}
    </HoverScale>
  );
}

export function QuadrantPicker({
  quadrants,
  onSelect,
  fillHeight = false,
}: QuadrantPickerProps) {
  const isDark = useIsDark();
  const { width } = useWindowDimensions();
  const byId = Object.fromEntries(quadrants.map((q) => [q.id, q])) as Record<
    EmotionQuadrantId,
    EmotionQuadrant
  >;
  const neutral = byId.neutral;

  const boardMax = Math.min(width - 48, 440);
  const gap = boardMax >= 380 ? 16 : 12;
  const cornerSize = Math.min(
    Math.floor((boardMax - gap) / 2),
    boardMax >= 380 ? 156 : 136
  );
  const neutralSize = Math.round(cornerSize * 0.58);
  const boardSize = cornerSize * 2 + gap;

  const positionStyle: Record<
    (typeof CORNER_LAYOUT)[number]["position"],
    { top?: number; left?: number; right?: number; bottom?: number }
  > = {
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0 },
    bottomLeft: { bottom: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
  };

  return (
    <View className={fillHeight ? "flex-1" : "pb-4"}>
      <View
        className={`rounded-2xl border px-5 py-4 mb-6 ${
          isDark
            ? "bg-sand-800/80 border-sand-700"
            : "bg-white/80 border-sand-200"
        }`}
      >
        <Text
          className={`text-[13px] leading-6 text-center ${textMuted(isDark)}`}
        >
          Touchez la zone qui correspond le mieux — rouge (tension), jaune
          (élan), bleu (calme), mauve (lourdeur), ou le centre si c&apos;est
          incertain.
        </Text>
      </View>

      <View
        className={
          fillHeight ? "flex-1 justify-center items-center" : "items-center"
        }
        style={{ maxWidth: boardMax, alignSelf: "center", width: "100%" }}
      >
        <View
          style={{
            width: boardSize,
            height: boardSize,
            position: "relative",
          }}
        >
          {CORNER_LAYOUT.map(({ id, position, innerRadius }) => {
            const quadrant = byId[id];
            if (!quadrant) return null;
            return (
              <View
                key={id}
                style={{ position: "absolute", ...positionStyle[position] }}
              >
                <QuadrantCell
                  quadrant={quadrant}
                  onPress={() => onSelect(quadrant)}
                  size={cornerSize}
                  variant="corner"
                  innerRadius={innerRadius}
                />
              </View>
            );
          })}

          {neutral ? (
            <View
              style={{
                position: "absolute",
                top: (boardSize - neutralSize) / 2,
                left: (boardSize - neutralSize) / 2,
                zIndex: 2,
              }}
            >
              <QuadrantCell
                quadrant={neutral}
                onPress={() => onSelect(neutral)}
                size={neutralSize}
                variant="neutral"
              />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
