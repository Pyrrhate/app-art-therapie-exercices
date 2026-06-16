import { useCallback, useMemo, useState } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import {
  hexFromHue,
  type LightnessPreset,
} from "@/lib/color-journey/theory";

const SEGMENT_COUNT = 72;
const PRESETS: { id: LightnessPreset; label: string }[] = [
  { id: "clair", label: "Clair" },
  { id: "moyen", label: "Moyen" },
  { id: "profond", label: "Profond" },
];

interface ChromaticWheelProps {
  size?: number;
  highlightHues?: number[];
  highlightSpread?: number;
  onConfirm: (hex: string) => void;
  disabled?: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const startInner = polarToCartesian(cx, cy, innerR, endAngle);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function hueFromTouch(
  x: number,
  y: number,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number
): number | null {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < innerR || dist > outerR) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  return ((angle % 360) + 360) % 360;
}

function isHueHighlighted(
  hue: number,
  highlights: number[],
  spread: number
): boolean {
  if (highlights.length === 0 || spread <= 0) return false;
  return highlights.some((h) => {
    const diff = Math.abs(hue - h) % 360;
    return diff <= spread || 360 - diff <= spread;
  });
}

export function ChromaticWheel({
  size = 280,
  highlightHues = [],
  highlightSpread = 24,
  onConfirm,
  disabled = false,
}: ChromaticWheelProps) {
  const [selectedHue, setSelectedHue] = useState<number | null>(null);
  const [preset, setPreset] = useState<LightnessPreset>("moyen");

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = size * 0.28;

  const segments = useMemo(() => {
    const list: { path: string; fill: string; hue: number; highlighted: boolean }[] =
      [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const hue = (i / SEGMENT_COUNT) * 360;
      const start = (i / SEGMENT_COUNT) * 2 * Math.PI - Math.PI / 2;
      const end = ((i + 1) / SEGMENT_COUNT) * 2 * Math.PI - Math.PI / 2;
      list.push({
        hue,
        path: arcPath(cx, cy, innerR, outerR, start, end),
        fill: hexFromHue(hue, "moyen"),
        highlighted: isHueHighlighted(hue, highlightHues, highlightSpread),
      });
    }
    return list;
  }, [cx, cy, innerR, outerR, highlightHues, highlightSpread]);

  const previewHex =
    selectedHue !== null ? hexFromHue(selectedHue, preset) : "#E8DDD4";

  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      const { locationX, locationY } = event.nativeEvent;
      const hue = hueFromTouch(locationX, locationY, cx, cy, innerR, outerR);
      if (hue !== null) setSelectedHue(hue);
    },
    [cx, cy, disabled, innerR, outerR]
  );

  return (
    <View className="items-center">
      <Pressable
        onPress={handleTouch}
        disabled={disabled}
        accessibilityRole="adjustable"
        accessibilityLabel="Roue chromatique"
      >
        <Svg width={size} height={size}>
          {segments.map((seg) => (
            <Path
              key={seg.hue}
              d={seg.path}
              fill={seg.fill}
              opacity={seg.highlighted ? 1 : highlightHues.length > 0 ? 0.45 : 1}
              stroke={seg.highlighted ? "#527058" : "transparent"}
              strokeWidth={seg.highlighted ? 1.5 : 0}
            />
          ))}
          {highlightHues.map((h) => {
            const rad = ((h - 90) * Math.PI) / 180;
            const marker = polarToCartesian(
              cx,
              cy,
              (innerR + outerR) / 2,
              rad
            );
            return (
              <Circle
                key={h}
                cx={marker.x}
                cy={marker.y}
                r={5}
                fill="#FAF7F4"
                stroke="#527058"
                strokeWidth={2}
              />
            );
          })}
          <Circle
            cx={cx}
            cy={cy}
            r={innerR - 6}
            fill={previewHex}
            stroke="#D4C4B5"
            strokeWidth={2}
          />
        </Svg>
      </Pressable>

      <Text className="text-sand-500 text-xs mt-3 mb-3 text-center px-4">
        Touchez la roue, puis ajustez la luminosité
      </Text>

      <View className="flex-row gap-2 mb-4">
        {PRESETS.map((item) => {
          const active = preset === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPreset(item.id)}
              disabled={disabled || selectedHue === null}
              className={`rounded-full px-4 py-2 border ${
                active
                  ? "bg-sage-500 border-sage-600"
                  : "bg-white border-sand-200"
              } ${selectedHue === null ? "opacity-40" : ""}`}
            >
              <Text
                className={`text-sm ${active ? "text-white" : "text-sand-700"}`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          if (selectedHue === null || disabled) return;
          onConfirm(hexFromHue(selectedHue, preset));
        }}
        disabled={disabled || selectedHue === null}
        className={`rounded-2xl px-6 py-4 items-center w-full bg-sage-500 ${
          disabled || selectedHue === null ? "opacity-40" : "active:bg-sage-600"
        }`}
      >
        <Text className="text-white text-base font-medium">
          Valider cette teinte
        </Text>
      </Pressable>
    </View>
  );
}
