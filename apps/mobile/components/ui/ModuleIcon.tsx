import Svg, { Circle, Rect } from "react-native-svg";
import { View } from "react-native";

export type ModuleIconId =
  | "ping-pong"
  | "color-journey"
  | "emotion-explorer"
  | "nuance-finder";

interface ModuleIconProps {
  id: ModuleIconId;
  size?: number;
}

const ICON_BG: Record<ModuleIconId, string> = {
  "ping-pong": "#E3EDE5",
  "color-journey": "#F0EBE4",
  "emotion-explorer": "#E3EDE5",
  "nuance-finder": "#F0EBE4",
};

const NUANCE_TILES = [
  "#E8DDD4",
  "#C4A484",
  "#D4C4B5",
  "#A8856A",
  "#F0EBE4",
  "#B8A090",
  "#C4A484",
  "#9A8070",
  "#D4C4B5",
  "#A8856A",
  "#E8DDD4",
  "#7A6558",
  "#C4A484",
  "#D4C4B5",
  "#B8A090",
  "#A8856A",
];

export function ModuleIcon({ id, size = 36 }: ModuleIconProps) {
  const box = 48;

  return (
    <View
      className="rounded-xl items-center justify-center mb-4"
      style={{
        width: box,
        height: box,
        backgroundColor: ICON_BG[id],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        {id === "ping-pong" && (
          <>
            <Circle cx="14" cy="20" r="8" fill="#496349" opacity={0.9} />
            <Circle cx="26" cy="20" r="8" fill="#8FA88A" opacity={0.55} />
          </>
        )}
        {id === "color-journey" && (
          <>
            <Circle
              cx="20"
              cy="20"
              r="12"
              fill="none"
              stroke="#A8856A"
              strokeWidth={2.5}
            />
            <Circle cx="20" cy="20" r="4.5" fill="#A8856A" />
          </>
        )}
        {id === "emotion-explorer" && (
          <>
            {[
              [14, 14, 0.55],
              [26, 14, 0.75],
              [14, 26, 0.45],
              [26, 26, 0.65],
            ].map(([cx, cy, opacity]) => (
              <Circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="5.5"
                fill="#8FA88A"
                opacity={opacity}
              />
            ))}
          </>
        )}
        {id === "nuance-finder" && (
          <>
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => (
                <Rect
                  key={`${row}-${col}`}
                  x={8 + col * 7}
                  y={8 + row * 7}
                  width={5.5}
                  height={5.5}
                  rx={1}
                  fill={NUANCE_TILES[row * 4 + col]!}
                />
              ))
            )}
          </>
        )}
      </Svg>
    </View>
  );
}
