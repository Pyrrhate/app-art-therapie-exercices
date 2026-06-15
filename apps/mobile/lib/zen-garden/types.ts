export type ZenTool = "rake" | "rock";

export type RockVariant = 0 | 1 | 2 | 3;

export interface ZenPoint {
  x: number;
  y: number;
}

export interface RakeStroke {
  id: string;
  points: ZenPoint[];
}

export interface ZenRock {
  id: string;
  x: number;
  y: number;
  variant: RockVariant;
}

export type ZenUndoEntry =
  | { kind: "stroke"; stroke: RakeStroke }
  | { kind: "rock"; rock: ZenRock }
  | { kind: "removeRock"; rock: ZenRock }
  | { kind: "moveRock"; rockId: string; from: ZenPoint; to: ZenPoint };

export interface ZenGardenState {
  strokes: RakeStroke[];
  rocks: ZenRock[];
  sandColor: string;
  updatedAt: string;
}

export const ZEN_VIEWBOX = 400;

export const DEFAULT_SAND_COLOR = "#E8DDD4";

export const RAKE_LINE_COLOR = "#B8A898";

export const ROCK_VARIANTS: Record<
  RockVariant,
  { rx: number; ry: number; label: string }
> = {
  0: { rx: 22, ry: 16, label: "Pierre plate" },
  1: { rx: 16, ry: 20, label: "Galet vertical" },
  2: { rx: 28, ry: 18, label: "Roche large" },
  3: { rx: 12, ry: 12, label: "Caillou" },
};
