import { Platform, Text, useWindowDimensions, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import type { EmotionQuadrant, EmotionQuadrantId } from "@/lib/emotion-explorer";
import { textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

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

function QuadrantCell({
  quadrant,
  onPress,
  size,
  variant,
}: {
  quadrant: EmotionQuadrant;
  onPress: () => void;
  size: number;
  variant: "corner" | "neutral";
}) {
  const isNeutral = variant === "neutral";
  const energySize = isNeutral ? 10 : 11;
  const valenceSize = isNeutral ? 14 : 16;

  const cell = (
    <View
      className="rounded-full items-center justify-center"
      style={{
        backgroundColor: quadrant.color,
        width: size,
        height: size,
        borderRadius: size / 2,
        paddingHorizontal: isNeutral ? 14 : 16,
        paddingVertical: 12,
        ...(Platform.OS === "web"
          ? ({ boxShadow: "0 4px 14px rgba(62, 52, 44, 0.12)" } as const)
          : null),
      }}
    >
      <Text
        className="text-sand-900 uppercase tracking-wider text-center opacity-85 mb-1.5"
        style={{ fontSize: energySize, lineHeight: energySize + 4 }}
      >
        {quadrant.energyLabel}
      </Text>
      <Text
        className="text-sand-900 font-medium text-center"
        style={{ fontSize: valenceSize, lineHeight: valenceSize + 6 }}
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
      hoverScale={1.04}
      style={{ width: size, height: size }}
    >
      {cell}
    </HoverScale>
  );
}

function QuadrantRow({
  ids,
  byId,
  onSelect,
  cellSize,
  gap,
}: {
  ids: EmotionQuadrantId[];
  byId: Record<EmotionQuadrantId, EmotionQuadrant>;
  onSelect: (q: EmotionQuadrant) => void;
  cellSize: number;
  gap: number;
}) {
  return (
    <View
      className="flex-row justify-center items-center"
      style={{ gap, marginBottom: gap }}
    >
      {ids.map((id) => {
        const quadrant = byId[id];
        if (!quadrant) return null;
        return (
          <QuadrantCell
            key={id}
            quadrant={quadrant}
            onPress={() => onSelect(quadrant)}
            size={cellSize}
            variant="corner"
          />
        );
      })}
    </View>
  );
}

export function QuadrantPicker({
  quadrants,
  onSelect,
  theme = "light",
}: QuadrantPickerProps) {
  const isDark = useIsDark();
  const { width } = useWindowDimensions();
  const byId = Object.fromEntries(quadrants.map((q) => [q.id, q])) as Record<
    EmotionQuadrantId,
    EmotionQuadrant
  >;
  const neutral = byId.neutral;

  const boardMax = Math.min(width - 48, 420);
  const gap = boardMax >= 380 ? 28 : 20;
  const cornerSize = Math.min(
    Math.floor((boardMax - gap) / 2),
    boardMax >= 380 ? 168 : 148
  );
  const neutralSize = Math.round(cornerSize * 0.72);

  const subtitleClass =
    theme === "dark" ? "text-sand-300" : textSecondary(isDark);

  return (
    <View className="py-4 pb-8">
      <Text
        className={`${subtitleClass} text-base text-center leading-7 mb-10 px-4`}
      >
        Touchez la teinte qui correspond le mieux à ce que vous ressentez — ou
        le centre si c&apos;est incertain.
      </Text>

      <View className="items-center" style={{ maxWidth: boardMax, alignSelf: "center" }}>
        <QuadrantRow
          ids={GRID_ORDER[0]}
          byId={byId}
          onSelect={onSelect}
          cellSize={cornerSize}
          gap={gap}
        />

        {neutral ? (
          <View className="items-center" style={{ marginVertical: gap }}>
            <QuadrantCell
              quadrant={neutral}
              onPress={() => onSelect(neutral)}
              size={neutralSize}
              variant="neutral"
            />
          </View>
        ) : null}

        <QuadrantRow
          ids={GRID_ORDER[1]}
          byId={byId}
          onSelect={onSelect}
          cellSize={cornerSize}
          gap={gap}
        />
      </View>
    </View>
  );
}
