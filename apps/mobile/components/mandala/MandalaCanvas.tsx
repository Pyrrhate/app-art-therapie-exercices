import { useCallback } from "react";
import { View } from "react-native";
import Svg, { G, Path, Rect } from "react-native-svg";
import { DEFAULT_MANDALA_FILL } from "@/lib/mandala/palette";
import type { MandalaFills, MandalaSpec } from "@/lib/mandala/types";

interface MandalaCanvasProps {
  spec: MandalaSpec;
  fills: MandalaFills;
  selectedColor: string;
  onFillPath: (pathId: string, color: string) => void;
  size?: number;
}

export function MandalaCanvas({
  spec,
  fills,
  selectedColor,
  onFillPath,
  size = 340,
}: MandalaCanvasProps) {
  const handlePress = useCallback(
    (pathId: string) => {
      onFillPath(pathId, selectedColor);
    },
    [onFillPath, selectedColor]
  );

  return (
    <View
      className="items-center justify-center bg-white rounded-2xl border border-sand-200 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={spec.viewBox}>
        <Rect x="0" y="0" width="400" height="400" fill="#FAF7F4" />
        <G>
          {spec.paths.map((path) => (
            <Path
              key={path.id}
              d={path.d}
              fill={fills[path.id] ?? DEFAULT_MANDALA_FILL}
              stroke="#E8DDD4"
              strokeWidth={0.6}
              onPress={() => handlePress(path.id)}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
