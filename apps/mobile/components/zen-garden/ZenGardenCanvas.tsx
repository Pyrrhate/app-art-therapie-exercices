import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  PanResponder,
  Platform,
  View,
  type GestureResponderEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";
import {
  getEventGardenPoint,
  measureGardenLayout,
  type GardenLayout,
} from "@/lib/zen-garden/pointer";
import { buildRakePaths, simplifyPoints } from "@/lib/zen-garden/rake";
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
  onMoveRock: (rockId: string, x: number, y: number) => void;
  onMoveRockEnd: (rockId: string, from: ZenPoint, to: ZenPoint) => void;
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
  onMoveRock,
  onMoveRockEnd,
  onLiveStrokeChange,
  interactive = true,
}: ZenGardenCanvasProps) {
  const containerRef = useRef<View>(null);
  const layoutRef = useRef<GardenLayout | null>(null);
  const currentPoints = useRef<ZenPoint[]>([]);
  const dragRockId = useRef<string | null>(null);
  const dragStart = useRef<ZenPoint | null>(null);
  const didDrag = useRef(false);
  const lastHaptic = useRef(0);

  const refreshLayout = useCallback(() => {
    measureGardenLayout(containerRef.current, (layout) => {
      layoutRef.current = layout;
    });
  }, []);

  useEffect(() => {
    refreshLayout();
  }, [size, refreshLayout]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === "web") return;
    const now = Date.now();
    if (now - lastHaptic.current < 80) return;
    lastHaptic.current = now;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toGardenPoint = useCallback(
    (event: GestureResponderEvent) =>
      getEventGardenPoint(event, layoutRef.current, size),
    [size]
  );

  const findRockAt = useCallback(
    (x: number, y: number): ZenRock | undefined =>
      rocks.find((rock) => {
        const spec = ROCK_VARIANTS[rock.variant];
        const hitRadius = Math.max(spec.rx, spec.ry) + 8;
        return Math.hypot(rock.x - x, rock.y - y) <= hitRadius;
      }),
    [rocks]
  );

  const rakePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive && tool === "rake",
        onMoveShouldSetPanResponder: () => interactive && tool === "rake",
        onPanResponderGrant: (event) => {
          refreshLayout();
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
            onStrokeComplete({ id: makeId(), points: simplified });
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
      refreshLayout,
      onLiveStrokeChange,
      onStrokeComplete,
      triggerHaptic,
    ]
  );

  const rockPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive && tool === "rock",
        onMoveShouldSetPanResponder: () => interactive && tool === "rock",
        onPanResponderGrant: (event) => {
          refreshLayout();
          const p = toGardenPoint(event);
          const hit = findRockAt(p.x, p.y);
          dragRockId.current = hit?.id ?? null;
          dragStart.current = hit ? { x: hit.x, y: hit.y } : null;
          didDrag.current = false;
          if (hit) triggerHaptic();
        },
        onPanResponderMove: (event) => {
          const id = dragRockId.current;
          if (!id) return;
          const p = toGardenPoint(event);
          didDrag.current = true;
          onMoveRock(id, p.x, p.y);
        },
        onPanResponderRelease: (event) => {
          const id = dragRockId.current;
          const start = dragStart.current;
          dragRockId.current = null;
          dragStart.current = null;

          if (id && didDrag.current && start) {
            const p = toGardenPoint(event);
            onMoveRockEnd(id, start, p);
            triggerHaptic();
            return;
          }

          if (!id && !didDrag.current) {
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
        },
        onPanResponderTerminate: () => {
          dragRockId.current = null;
          dragStart.current = null;
        },
      }),
    [
      interactive,
      tool,
      toGardenPoint,
      refreshLayout,
      findRockAt,
      rockVariant,
      onMoveRock,
      onMoveRockEnd,
      onPlaceRock,
      onRemoveRock,
      triggerHaptic,
    ]
  );

  const allStrokes = liveStroke?.length
    ? [...strokes, { id: "live", points: liveStroke }]
    : strokes;

  const panHandlers =
    tool === "rake" ? rakePan.panHandlers : rockPan.panHandlers;

  return (
    <View
      ref={containerRef}
      onLayout={refreshLayout}
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
            />
          );
        })}
      </Svg>

      {interactive && (
        <View
          {...panHandlers}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            ...(Platform.OS === "web"
              ? { cursor: tool === "rake" ? "crosshair" : "pointer" }
              : null),
          }}
        />
      )}
    </View>
  );
}
