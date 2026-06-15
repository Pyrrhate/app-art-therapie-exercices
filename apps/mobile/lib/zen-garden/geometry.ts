import {
  GROUND_Y,
  ZEN_VIEWBOX_HEIGHT,
  ZEN_VIEWBOX_WIDTH,
  type ZenPoint,
} from "./types";

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
  canvasWidth: number,
  canvasHeight: number,
  margin = 8
): ZenPoint {
  const scaleX = ZEN_VIEWBOX_WIDTH / canvasWidth;
  const scaleY = ZEN_VIEWBOX_HEIGHT / canvasHeight;
  return {
    x: Math.max(margin, Math.min(ZEN_VIEWBOX_WIDTH - margin, x * scaleX)),
    y: Math.max(margin, Math.min(ZEN_VIEWBOX_HEIGHT - margin, y * scaleY)),
  };
}

/** Profil de sable : contour depuis la ligne de sol jusqu'aux points du pinceau. */
export function buildSandPatchPath(
  points: ZenPoint[],
  groundY = GROUND_Y
): string {
  if (points.length < 2) return "";
  const profile = points.map((p) => ({
    x: p.x,
    y: Math.min(p.y, groundY - 2),
  }));
  let d = `M ${profile[0]!.x.toFixed(2)} ${groundY}`;
  for (const p of profile) {
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  d += ` L ${profile[profile.length - 1]!.x.toFixed(2)} ${groundY} Z`;
  return d;
}

/** Corps d'eau avec surface ondulée en haut. */
export function buildWaterPath(
  x: number,
  y: number,
  width: number,
  height: number,
  waveAmp = 2.5
): string {
  const w = Math.max(width, 4);
  const h = Math.max(height, 4);
  const bottom = y + h;
  const segments = Math.max(3, Math.round(w / 18));
  let d = `M ${x.toFixed(2)} ${bottom.toFixed(2)} L ${x.toFixed(2)} ${(y + waveAmp).toFixed(2)}`;
  for (let i = 0; i <= segments; i += 1) {
    const wx = x + (w * i) / segments;
    const wy = y + (i % 2 === 0 ? 0 : waveAmp * 1.6);
    d += ` L ${wx.toFixed(2)} ${wy.toFixed(2)}`;
  }
  d += ` L ${(x + w).toFixed(2)} ${bottom.toFixed(2)} Z`;
  return d;
}

export function normalizeWaterRect(
  start: ZenPoint,
  end: ZenPoint,
  groundY = GROUND_Y
): { x: number; y: number; width: number; height: number } | null {
  const x = Math.min(start.x, end.x);
  const width = Math.abs(end.x - start.x);
  const surfaceY = Math.min(start.y, end.y, groundY - 4);
  const bottomY = groundY;
  const height = bottomY - surfaceY;
  if (width < 6 || height < 4) return null;
  return { x, y: surfaceY, width, height };
}
