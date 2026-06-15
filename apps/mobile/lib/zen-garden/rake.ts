import type { ZenPoint } from "./types";

const TINE_COUNT = 7;
const TINE_SPACING = 2.8;

function offsetPolyline(points: ZenPoint[], tineIndex: number): ZenPoint[] {
  const center = (TINE_COUNT - 1) / 2;
  const offset = (tineIndex - center) * TINE_SPACING;

  return points.map((p, i) => {
    const prev = points[i - 1] ?? p;
    const next = points[i + 1] ?? p;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      x: p.x + (-dy / len) * offset,
      y: p.y + (dy / len) * offset,
    };
  });
}

function pointsToPathD(points: ZenPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (const p of rest) {
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}

/** Génère les chemins SVG des dents du râteau pour une polyligne. */
export function buildRakePaths(points: ZenPoint[]): string[] {
  if (points.length < 2) return [];

  const paths: string[] = [];
  for (let t = 0; t < TINE_COUNT; t += 1) {
    const offset = offsetPolyline(points, t);
    const d = pointsToPathD(offset);
    if (d) paths.push(d);
  }
  return paths;
}

export function simplifyPoints(
  points: ZenPoint[],
  minDistance = 2.5
): ZenPoint[] {
  if (points.length === 0) return [];
  const result: ZenPoint[] = [points[0]!];
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i]!;
    const last = result[result.length - 1]!;
    if (Math.hypot(p.x - last.x, p.y - last.y) >= minDistance) {
      result.push(p);
    }
  }
  return result;
}

export function clampToViewBox(
  x: number,
  y: number,
  size: number,
  viewBox = 400,
  margin = 8
): ZenPoint {
  const scale = viewBox / size;
  return {
    x: Math.max(margin, Math.min(viewBox - margin, x * scale)),
    y: Math.max(margin, Math.min(viewBox - margin, y * scale)),
  };
}
