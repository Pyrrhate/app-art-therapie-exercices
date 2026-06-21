import { Text, useWindowDimensions, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import type { EmotionQuadrant, EmotionQuadrantId } from "@/lib/emotion-explorer";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface QuadrantPickerProps {
  quadrants: EmotionQuadrant[];
  onSelect: (quadrant: EmotionQuadrant) => void;
  /** Occupe l'espace restant et centre la grille de cercles en hauteur. */
  fillHeight?: boolean;
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

  const cell = (
    <View
      className="rounded-full items-center justify-center"
      style={{
        backgroundColor: quadrant.color,
        width: size,
        height: size,
        borderRadius: size / 2,
        paddingHorizontal: isNeutral ? 12 : 14,
        paddingVertical: isNeutral ? 10 : 12,
      }}
    >
      <Text
        className="text-sand-900/80 uppercase text-center mb-1.5 font-medium"
        style={{
          fontSize: isNeutral ? 9 : 10,
          letterSpacing: 1.2,
          lineHeight: 14,
        }}
      >
        {quadrant.energyLabel}
      </Text>
      <Text
        className="font-display text-sand-900 text-center"
        style={{
          fontSize: isNeutral ? 15 : 17,
          lineHeight: isNeutral ? 20 : 22,
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
  const gap = boardMax >= 380 ? 24 : 18;
  const cornerSize = Math.min(
    Math.floor((boardMax - gap) / 2),
    boardMax >= 380 ? 172 : 150
  );
  const neutralSize = Math.round(cornerSize * 0.68);

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
          Touchez la zone qui correspond le mieux à ce que vous ressentez — ou
          le centre si c&apos;est incertain.
        </Text>
      </View>

      <View
        className={
          fillHeight
            ? "flex-1 justify-center items-center"
            : "items-center"
        }
        style={{ maxWidth: boardMax, alignSelf: "center", width: "100%" }}
      >
        <QuadrantRow
          ids={GRID_ORDER[0]}
          byId={byId}
          onSelect={onSelect}
          cellSize={cornerSize}
          gap={gap}
        />

        {neutral ? (
          <View className="items-center" style={{ marginVertical: gap * 0.85 }}>
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
