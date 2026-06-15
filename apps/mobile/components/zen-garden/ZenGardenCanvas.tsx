import { useCallback, useMemo, useRef } from "react";
import {
  PanResponder,
  Platform,
  Pressable,
  View,
  type GestureResponderEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";
import { buildRakePaths, clampToViewBox, simplifyPoints } from "@/lib/zen-garden/rake";
import {
  DEFAULT_SAND_COLOR,
  RAKE_LINE_COLOR,
  ROCK_VARIANTS,
  ZEN_VIEWBOX,
  type RakeStroke,
  type RockVariant,
  type ZenPoint,
  type ZenRock,
  type ZenTool,
} from "@/lib/zen-garden/types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface ZenGardenCanvasProps {
  size: number;
  sandColor?: string;
  strokes: RakeStroke[];
  rocks: ZenRock[];
  tool: ZenTool;
  rockVariant: RockVariant;
  liveStroke?: ZenPoint[] | null;
  onStrokeComplete: (stroke: RakeStroke) => void;
  onPlaceRock: (rock: ZenRock) => void;
  onRemoveRock: (rockId: string) => void;
  onLiveStrokeChange?: (points: ZenPoint[] | null) => void;
  interactive?: boolean;
}

export function ZenGardenCanvas({
  size,
  sandColor = DEFAULT_SAND_COLOR,
  strokes,
  rocks,
  tool,
  rockVariant,
  liveStroke,
  onStrokeComplete,
  onPlaceRock,
  onRemoveRock,
  onLiveStrokeChange,
  interactive = true,
}: ZenGardenCanvasProps) {
  const currentPoints = useRef<ZenPoint[]>([]);
  const lastHaptic = useRef(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === "web") return;
    const now = Date.now();
    if (now - lastHaptic.current < 80) return;
    lastHaptic.current = now;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toGardenPoint = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      return clampToViewBox(locationX, locationY, size);
    },
    [size]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          interactive && tool === "rake",
        onMoveShouldSetPanResponder: () =>
          interactive && tool === "rake",
        onPanResponderGrant: (event) => {
          const p = toGardenPoint(event);
          currentPoints.current = [p];
          onLiveStrokeChange?.([p]);
          triggerHaptic();
        },
        onPanResponderMove: (event) => {
          const p = toGardenPoint(event);
          const last = currentPoints.current[currentPoints.current.length - 1];
          if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
          currentPoints.current.push(p);
          onLiveStrokeChange?.([...currentPoints.current]);
          triggerHaptic();
        },
        onPanResponderRelease: () => {
          const simplified = simplifyPoints(currentPoints.current);
          currentPoints.current = [];
          onLiveStrokeChange?.(null);
          if (simplified.length >= 2) {
            onStrokeComplete({
              id: makeId(),
              points: simplified,
            });
          }
        },
        onPanResponderTerminate: () => {
          currentPoints.current = [];
          onLiveStrokeChange?.(null);
        },
      }),
    [
      interactive,
      tool,
      toGardenPoint,
      onLiveStrokeChange,
      onStrokeComplete,
      triggerHaptic,
    ]
  );

  function findRockAt(x: number, y: number): ZenRock | undefined {
    return rocks.find((rock) => {
      const spec = ROCK_VARIANTS[rock.variant];
      const hitRadius = Math.max(spec.rx, spec.ry) + 6;
      return Math.hypot(rock.x - x, rock.y - y) <= hitRadius;
    });
  }

  function handleRockPress(event: GestureResponderEvent) {
    if (!interactive || tool !== "rock") return;
    const p = toGardenPoint(event);
    const existing = findRockAt(p.x, p.y);
    if (existing) {
      onRemoveRock(existing.id);
    } else {
      onPlaceRock({
        id: makeId(),
        x: p.x,
        y: p.y,
        variant: rockVariant,
      });
    }
    triggerHaptic();
  }

  const allStrokes = liveStroke?.length
    ? [...strokes, { id: "live", points: liveStroke }]
    : strokes;

  return (
    <View
      className="rounded-2xl border border-sand-300 overflow-hidden self-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${ZEN_VIEWBOX} ${ZEN_VIEWBOX}`}>
        <Rect x="0" y="0" width={ZEN_VIEWBOX} height={ZEN_VIEWBOX} fill={sandColor} />
        <Rect
          x="8"
          y="8"
          width="384"
          height="384"
          rx="12"
          fill="none"
          stroke="#D4C4B5"
          strokeWidth="1"
        />
        {allStrokes.map((stroke) =>
          buildRakePaths(stroke.points).map((d, i) => (
            <Path
              key={`${stroke.id}-${i}`}
              d={d}
              fill="none"
              stroke={RAKE_LINE_COLOR}
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          ))
        )}
        {rocks.map((rock) => {
          const spec = ROCK_VARIANTS[rock.variant];
          return (
            <Ellipse
              key={`${rock.id}-shadow`}
              cx={rock.x + 3}
              cy={rock.y + 5}
              rx={spec.rx * 0.9}
              ry={spec.ry * 0.5}
              fill="rgba(80,70,60,0.15)"
            />
          );
        })}
        {rocks.map((rock) => {
          const spec = ROCK_VARIANTS[rock.variant];
          return (
            <Ellipse
              key={rock.id}
              cx={rock.x}
              cy={rock.y}
              rx={spec.rx}
              ry={spec.ry}
              fill="#5C5650"
              stroke="#4A4540"
              strokeWidth={1.2}
            />
          );
        })}
        {rocks.map((rock) => {
          const spec = ROCK_VARIANTS[rock.variant];
          return (
            <Ellipse
              key={`${rock.id}-hi`}
              cx={rock.x - spec.rx * 0.25}
              cy={rock.y - spec.ry * 0.2}
              rx={spec.rx * 0.35}
              ry={spec.ry * 0.25}
              fill="rgba(255,255,255,0.12)"
              pointerEvents="none"
            />
          );
        })}
      </Svg>

      {interactive && (
        <View
          {...(tool === "rake" ? panResponder.panHandlers : {})}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
          }}
        >
          {tool === "rock" && (
            <Pressable
              style={{ flex: 1 }}
              onPress={handleRockPress}
            />
          )}
        </View>
      )}
    </View>
  );
}
