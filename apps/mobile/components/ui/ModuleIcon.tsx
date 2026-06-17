import Svg, { Circle, Path, Rect } from "react-native-svg";
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

const ACCENT: Record<ModuleIconId, string> = {
  "ping-pong": "#6B8F71",
  "color-journey": "#C4A484",
  "emotion-explorer": "#8FA88A",
  "nuance-finder": "#A8856A",
};

export function ModuleIcon({ id, size = 40 }: ModuleIconProps) {
  const color = ACCENT[id];

  return (
    <View
      className="rounded-xl items-center justify-center mb-2"
      style={{
        width: size + 8,
        height: size + 8,
        backgroundColor: `${color}18`,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        {id === "ping-pong" && (
          <>
            <Circle cx="14" cy="20" r="8" fill={color} opacity={0.85} />
            <Circle cx="26" cy="20" r="8" fill={color} opacity={0.45} />
          </>
        )}
        {id === "color-journey" && (
          <>
            <Circle cx="20" cy="20" r="14" fill="none" stroke={color} strokeWidth={3} />
            <Circle cx="20" cy="20" r="5" fill={color} />
            <Path d="M20 6 A14 14 0 0 1 34 20" fill="none" stroke={color} strokeWidth={4} opacity={0.5} />
          </>
        )}
        {id === "emotion-explorer" && (
          <>
            <Circle cx="12" cy="14" r="7" fill={color} opacity={0.6} />
            <Circle cx="28" cy="14" r="7" fill={color} opacity={0.85} />
            <Circle cx="12" cy="28" r="7" fill={color} opacity={0.4} />
            <Circle cx="28" cy="28" r="7" fill={color} opacity={0.75} />
            <Circle cx="20" cy="21" r="5" fill="#FAF7F4" />
          </>
        )}
        {id === "nuance-finder" && (
          <>
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => (
                <Rect
                  key={`${row}-${col}`}
                  x={6 + col * 8}
                  y={6 + row * 8}
                  width={6}
                  height={6}
                  rx={1}
                  fill={color}
                  opacity={0.35 + ((row + col) % 3) * 0.2}
                />
              ))
            )}
          </>
        )}
      </Svg>
    </View>
  );
}
