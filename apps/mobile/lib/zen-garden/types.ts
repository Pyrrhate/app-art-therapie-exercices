export type ZenTool = "sand" | "water" | "pebble";

export type PebbleVariant = 0 | 1 | 2 | 3;

export interface ZenPoint {
  x: number;
  y: number;
}

export interface SandPatch {
  id: string;
  points: ZenPoint[];
}

export interface WaterBody {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZenPebble {
  id: string;
  x: number;
  y: number;
  variant: PebbleVariant;
}

export type ZenUndoEntry =
  | { kind: "sand"; patch: SandPatch }
  | { kind: "water"; body: WaterBody }
  | { kind: "pebble"; pebble: ZenPebble }
  | { kind: "removePebble"; pebble: ZenPebble }
  | { kind: "movePebble"; pebbleId: string; from: ZenPoint; to: ZenPoint };

export interface ZenGardenState {
  version: 2;
  sandPatches: SandPatch[];
  waterBodies: WaterBody[];
  pebbles: ZenPebble[];
  sandColor: string;
  updatedAt: string;
}

export const ZEN_STATE_VERSION = 2;

export const ZEN_VIEWBOX_WIDTH = 400;
export const ZEN_VIEWBOX_HEIGHT = 220;
export const ZEN_ASPECT_RATIO = ZEN_VIEWBOX_WIDTH / ZEN_VIEWBOX_HEIGHT;

export const GROUND_Y = 170;
export const SOIL_TOP = GROUND_Y;
export const SOIL_BOTTOM = ZEN_VIEWBOX_HEIGHT;

export const DEFAULT_SAND_COLOR = "#E8DDD4";
export const SAND_STROKE_COLOR = "#D4C4B5";
export const SKY_COLOR = "#E5EBE7";
export const SOIL_COLOR = "#9C8570";
export const WATER_COLOR = "#7BA7BC";
export const WATER_OPACITY = 0.55;

export const PEBBLE_VARIANTS: Record<
  PebbleVariant,
  { rx: number; ry: number; label: string }
> = {
  0: { rx: 20, ry: 9, label: "Galet plat" },
  1: { rx: 11, ry: 13, label: "Galet vertical" },
  2: { rx: 26, ry: 10, label: "Galet large" },
  3: { rx: 8, ry: 8, label: "Caillou" },
};

export function createDefaultZenGardenState(): ZenGardenState {
  return {
    version: ZEN_STATE_VERSION,
    sandPatches: [],
    waterBodies: [],
    pebbles: [],
    sandColor: DEFAULT_SAND_COLOR,
    updatedAt: new Date().toISOString(),
  };
}
