import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  PanResponder,
  Platform,
  View,
  type GestureResponderEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Ellipse, Line, Path, Rect } from "react-native-svg";
import {
  buildSandPatchPath,
  buildWaterPath,
  normalizeWaterRect,
  simplifyPoints,
} from "@/lib/zen-garden/geometry";
import {
  getEventGardenPoint,
  measureGardenLayout,
  type GardenLayout,
} from "@/lib/zen-garden/pointer";
import {
  DEFAULT_SAND_COLOR,
  GROUND_Y,
  PEBBLE_VARIANTS,
  SAND_STROKE_COLOR,
  SKY_COLOR,
  SOIL_BOTTOM,
  SOIL_COLOR,
  SOIL_TOP,
  WATER_COLOR,
  WATER_OPACITY,
  ZEN_ASPECT_RATIO,
  ZEN_VIEWBOX_HEIGHT,
  ZEN_VIEWBOX_WIDTH,
  type PebbleVariant,
  type SandPatch,
  type WaterBody,
  type ZenPebble,
  type ZenPoint,
  type ZenTool,
} from "@/lib/zen-garden/types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface ZenGardenCanvasProps {
  width: number;
  sandColor?: string;
  sandPatches: SandPatch[];
  waterBodies: WaterBody[];
  pebbles: ZenPebble[];
  tool: ZenTool;
  pebbleVariant: PebbleVariant;
  liveSandPoints?: ZenPoint[] | null;
  liveWaterRect?: { start: ZenPoint; end: ZenPoint } | null;
  onSandComplete: (patch: SandPatch) => void;
  onWaterComplete: (body: WaterBody) => void;
  onPlacePebble: (pebble: ZenPebble) => void;
  onRemovePebble: (pebbleId: string) => void;
  onMovePebble: (pebbleId: string, x: number, y: number) => void;
  onMovePebbleEnd: (pebbleId: string, from: ZenPoint, to: ZenPoint) => void;
  onLiveSandChange?: (points: ZenPoint[] | null) => void;
  onLiveWaterChange?: (rect: { start: ZenPoint; end: ZenPoint } | null) => void;
  interactive?: boolean;
}

export function ZenGardenCanvas({
  width,
  sandColor = DEFAULT_SAND_COLOR,
  sandPatches,
  waterBodies,
  pebbles,
  tool,
  pebbleVariant,
  liveSandPoints,
  liveWaterRect,
  onSandComplete,
  onWaterComplete,
  onPlacePebble,
  onRemovePebble,
  onMovePebble,
  onMovePebbleEnd,
  onLiveSandChange,
  onLiveWaterChange,
  interactive = true,
}: ZenGardenCanvasProps) {
  const height = Math.round(width / ZEN_ASPECT_RATIO);
  const containerRef = useRef<View>(null);
  const layoutRef = useRef<GardenLayout | null>(null);
  const currentSandPoints = useRef<ZenPoint[]>([]);
  const waterStart = useRef<ZenPoint | null>(null);
  const dragPebbleId = useRef<string | null>(null);
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
  }, [width, height, refreshLayout]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === "web") return;
    const now = Date.now();
    if (now - lastHaptic.current < 80) return;
    lastHaptic.current = now;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toGardenPoint = useCallback(
    (event: GestureResponderEvent) =>
      getEventGardenPoint(event, layoutRef.current, width, height),
    [width, height]
  );

  const findPebbleAt = useCallback(
    (x: number, y: number): ZenPebble | undefined =>
      pebbles.find((pebble) => {
        const spec = PEBBLE_VARIANTS[pebble.variant];
        const hitRadius = Math.max(spec.rx, spec.ry) + 8;
        return Math.hypot(pebble.x - x, pebble.y - y) <= hitRadius;
      }),
    [pebbles]
  );

  const pebbleCenterY = useCallback((variant: PebbleVariant) => {
    const ry = PEBBLE_VARIANTS[variant].ry;
    return GROUND_Y - ry + 1;
  }, []);

  const sandPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive && tool === "sand",
        onMoveShouldSetPanResponder: () => interactive && tool === "sand",
        onPanResponderGrant: (event) => {
          refreshLayout();
          const p = toGardenPoint(event);
          currentSandPoints.current = [p];
          onLiveSandChange?.([p]);
          triggerHaptic();
        },
        onPanResponderMove: (event) => {
          const p = toGardenPoint(event);
          const last = currentSandPoints.current[currentSandPoints.current.length - 1];
          if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
          currentSandPoints.current.push(p);
          onLiveSandChange?.([...currentSandPoints.current]);
          triggerHaptic();
        },
        onPanResponderRelease: () => {
          const simplified = simplifyPoints(currentSandPoints.current);
          currentSandPoints.current = [];
          onLiveSandChange?.(null);
          if (simplified.length >= 2) {
            onSandComplete({ id: makeId(), points: simplified });
          }
        },
        onPanResponderTerminate: () => {
          currentSandPoints.current = [];
          onLiveSandChange?.(null);
        },
      }),
    [
      interactive,
      tool,
      toGardenPoint,
      refreshLayout,
      onLiveSandChange,
      onSandComplete,
      triggerHaptic,
    ]
  );

  const waterPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive && tool === "water",
        onMoveShouldSetPanResponder: () => interactive && tool === "water",
        onPanResponderGrant: (event) => {
          refreshLayout();
          const p = toGardenPoint(event);
          waterStart.current = p;
          onLiveWaterChange?.({ start: p, end: p });
          triggerHaptic();
        },
        onPanResponderMove: (event) => {
          const start = waterStart.current;
          if (!start) return;
          const p = toGardenPoint(event);
          onLiveWaterChange?.({ start, end: p });
        },
        onPanResponderRelease: (event) => {
          const start = waterStart.current;
          waterStart.current = null;
          onLiveWaterChange?.(null);
          if (!start) return;
          const end = toGardenPoint(event);
          const rect = normalizeWaterRect(start, end);
          if (rect) {
            onWaterComplete({ id: makeId(), ...rect });
            triggerHaptic();
            return;
          }
          onWaterComplete({
            id: makeId(),
            x: start.x - 20,
            y: GROUND_Y - 28,
            width: 40,
            height: 28,
          });
          triggerHaptic();
        },
        onPanResponderTerminate: () => {
          waterStart.current = null;
          onLiveWaterChange?.(null);
        },
      }),
    [
      interactive,
      tool,
      toGardenPoint,
      refreshLayout,
      onLiveWaterChange,
      onWaterComplete,
      triggerHaptic,
    ]
  );

  const pebblePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive && tool === "pebble",
        onMoveShouldSetPanResponder: () => interactive && tool === "pebble",
        onPanResponderGrant: (event) => {
          refreshLayout();
          const p = toGardenPoint(event);
          const hit = findPebbleAt(p.x, p.y);
          dragPebbleId.current = hit?.id ?? null;
          dragStart.current = hit ? { x: hit.x, y: hit.y } : null;
          didDrag.current = false;
          if (hit) triggerHaptic();
        },
        onPanResponderMove: (event) => {
          const id = dragPebbleId.current;
          if (!id) return;
          const p = toGardenPoint(event);
          didDrag.current = true;
          const spec = PEBBLE_VARIANTS[
            pebbles.find((item) => item.id === id)?.variant ?? pebbleVariant
          ];
          onMovePebble(id, p.x, GROUND_Y - spec.ry + 1);
        },
        onPanResponderRelease: (event) => {
          const id = dragPebbleId.current;
          const start = dragStart.current;
          dragPebbleId.current = null;
          dragStart.current = null;

          if (id && didDrag.current && start) {
            const p = toGardenPoint(event);
            const spec = PEBBLE_VARIANTS[
              pebbles.find((item) => item.id === id)?.variant ?? pebbleVariant
            ];
            const to = { x: p.x, y: GROUND_Y - spec.ry + 1 };
            onMovePebbleEnd(id, start, to);
            triggerHaptic();
            return;
          }

          if (!id && !didDrag.current) {
            const p = toGardenPoint(event);
            const existing = findPebbleAt(p.x, p.y);
            if (existing) {
              onRemovePebble(existing.id);
            } else {
              onPlacePebble({
                id: makeId(),
                x: p.x,
                y: pebbleCenterY(pebbleVariant),
                variant: pebbleVariant,
              });
            }
            triggerHaptic();
          }
        },
        onPanResponderTerminate: () => {
          dragPebbleId.current = null;
          dragStart.current = null;
        },
      }),
    [
      interactive,
      tool,
      toGardenPoint,
      refreshLayout,
      findPebbleAt,
      pebbleVariant,
      pebbles,
      pebbleCenterY,
      onMovePebble,
      onMovePebbleEnd,
      onPlacePebble,
      onRemovePebble,
      triggerHaptic,
    ]
  );

  const allSandPatches =
    liveSandPoints && liveSandPoints.length >= 2
      ? [...sandPatches, { id: "live", points: liveSandPoints }]
      : sandPatches;

  const panHandlers =
    tool === "sand"
      ? sandPan.panHandlers
      : tool === "water"
        ? waterPan.panHandlers
        : pebblePan.panHandlers;

  const cursorStyle =
    tool === "sand" ? "crosshair" : tool === "water" ? "cell" : "pointer";

  return (
    <View
      ref={containerRef}
      onLayout={refreshLayout}
      className="rounded-2xl border border-sand-300 overflow-hidden self-center"
      style={{ width, height }}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${ZEN_VIEWBOX_WIDTH} ${ZEN_VIEWBOX_HEIGHT}`}
      >
        <Rect x="0" y="0" width={ZEN_VIEWBOX_WIDTH} height={GROUND_Y} fill={SKY_COLOR} />
        <Rect
          x="0"
          y={SOIL_TOP}
          width={ZEN_VIEWBOX_WIDTH}
          height={SOIL_BOTTOM - SOIL_TOP}
          fill={SOIL_COLOR}
        />
        <Line
          x1="0"
          y1={GROUND_Y}
          x2={ZEN_VIEWBOX_WIDTH}
          y2={GROUND_Y}
          stroke="#8B7355"
          strokeWidth={0.6}
          opacity={0.5}
        />

        {allSandPatches.map((patch) => {
          const d = buildSandPatchPath(patch.points);
          if (!d) return null;
          return (
            <Path
              key={patch.id}
              d={d}
              fill={sandColor}
              stroke={SAND_STROKE_COLOR}
              strokeWidth={0.8}
              opacity={0.95}
            />
          );
        })}

        {waterBodies.map((body) => (
          <Path
            key={body.id}
            d={buildWaterPath(body.x, body.y, body.width, body.height)}
            fill={WATER_COLOR}
            opacity={WATER_OPACITY}
          />
        ))}
        {waterBodies.map((body) => (
          <Path
            key={`${body.id}-wave`}
            d={buildWaterPath(body.x, body.y, body.width, body.height)}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={0.8}
          />
        ))}

        {liveWaterRect &&
          (() => {
            const rect = normalizeWaterRect(
              liveWaterRect.start,
              liveWaterRect.end
            );
            if (!rect) return null;
            return (
              <Path
                d={buildWaterPath(rect.x, rect.y, rect.width, rect.height)}
                fill={WATER_COLOR}
                opacity={WATER_OPACITY * 0.7}
              />
            );
          })()}

        {pebbles.map((pebble) => {
          const spec = PEBBLE_VARIANTS[pebble.variant];
          return (
            <Ellipse
              key={`${pebble.id}-shadow`}
              cx={pebble.x + 2}
              cy={pebble.y + 4}
              rx={spec.rx * 0.85}
              ry={spec.ry * 0.35}
              fill="rgba(80,70,60,0.18)"
            />
          );
        })}
        {pebbles.map((pebble) => {
          const spec = PEBBLE_VARIANTS[pebble.variant];
          return (
            <Ellipse
              key={pebble.id}
              cx={pebble.x}
              cy={pebble.y}
              rx={spec.rx}
              ry={spec.ry}
              fill="#5C5650"
              stroke="#4A4540"
              strokeWidth={1.1}
            />
          );
        })}
        {pebbles.map((pebble) => {
          const spec = PEBBLE_VARIANTS[pebble.variant];
          return (
            <Ellipse
              key={`${pebble.id}-hi`}
              cx={pebble.x - spec.rx * 0.22}
              cy={pebble.y - spec.ry * 0.25}
              rx={spec.rx * 0.32}
              ry={spec.ry * 0.22}
              fill="rgba(255,255,255,0.14)"
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
            width,
            height,
            ...(Platform.OS === "web" ? { cursor: cursorStyle } : null),
          }}
        />
      )}
    </View>
  );
}
