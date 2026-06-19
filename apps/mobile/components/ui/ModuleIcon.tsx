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

const STROKE = "#496349";

export function ModuleIcon({ id, size = 22 }: ModuleIconProps) {
  const box = 44;

  return (
    <View
      className="rounded-full items-center justify-center mb-4 bg-sage-100"
      style={{ width: box, height: box }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        {id === "ping-pong" && (
          <>
            <Circle cx="14" cy="20" r="7" fill="none" stroke={STROKE} strokeWidth={2.5} />
            <Circle cx="26" cy="20" r="7" fill="none" stroke={STROKE} strokeWidth={2.5} />
          </>
        )}
        {id === "color-journey" && (
          <>
            <Circle cx="20" cy="20" r="13" fill="none" stroke={STROKE} strokeWidth={2.5} />
            <Circle cx="20" cy="20" r="4" fill={STROKE} />
          </>
        )}
        {id === "emotion-explorer" && (
          <Path
            d="M20 8 C28 8 32 16 32 22 C32 30 26 34 20 34 C14 34 8 30 8 22 C8 16 12 8 20 8 Z"
            fill="none"
            stroke={STROKE}
            strokeWidth={2.5}
          />
        )}
        {id === "nuance-finder" && (
          <>
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <Rect
                  key={`${row}-${col}`}
                  x={10 + col * 8}
                  y={10 + row * 8}
                  width={6}
                  height={6}
                  rx={1}
                  fill={STROKE}
                  opacity={0.45 + ((row + col) % 2) * 0.25}
                />
              ))
            )}
          </>
        )}
      </Svg>
    </View>
  );
}
