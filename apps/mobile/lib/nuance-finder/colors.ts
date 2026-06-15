export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Crème neutre — palette apaisante de l'app */
export const NEUTRAL_CREAM: Rgb = { r: 250, g: 247, b: 244 };

export const PRIMARY_SOURCES = [
  { id: "cyan", label: "Cyan", hex: "#00CED1", rgb: { r: 0, g: 206, b: 209 } },
  {
    id: "magenta",
    label: "Magenta",
    hex: "#FF1493",
    rgb: { r: 255, g: 20, b: 147 },
  },
  {
    id: "yellow",
    label: "Jaune",
    hex: "#FFD700",
    rgb: { r: 255, g: 215, b: 0 },
  },
] as const;

export type PrimarySource = (typeof PRIMARY_SOURCES)[number];

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const mix = Math.max(0, Math.min(1, t));
  return {
    r: a.r + (b.r - a.r) * mix,
    g: a.g + (b.g - a.g) * mix,
    b: a.b + (b.b - a.b) * mix,
  };
}

export interface ColorSource {
  hex: string;
  rgb: Rgb;
  label?: string;
}

export interface SourcePoint {
  row: number;
  col: number;
  source: ColorSource;
}

/** Distance euclidienne entre deux cases */
export function cellDistance(
  aRow: number,
  aCol: number,
  bRow: number,
  bCol: number
): number {
  return Math.hypot(aRow - bRow, aCol - bCol);
}

/**
 * Teinte révélée d'une case non-source : mélange pondéré des sources proches,
 * adouci vers le crème neutre quand la distance augmente.
 */
export function blendCellColor(
  row: number,
  col: number,
  sources: SourcePoint[],
  influenceRadius = 4.5
): string {
  if (sources.length === 0) {
    return rgbToHex(NEUTRAL_CREAM);
  }

  let totalWeight = 0;
  let blended: Rgb = { r: 0, g: 0, b: 0 };
  let minDist = Infinity;

  for (const { row: sRow, col: sCol, source } of sources) {
    const d = cellDistance(row, col, sRow, sCol);
    minDist = Math.min(minDist, d);
    const w = 1 / (d * d + 0.35);
    totalWeight += w;
    blended.r += source.rgb.r * w;
    blended.g += source.rgb.g * w;
    blended.b += source.rgb.b * w;
  }

  if (totalWeight <= 0) {
    return rgbToHex(NEUTRAL_CREAM);
  }

  blended = {
    r: blended.r / totalWeight,
    g: blended.g / totalWeight,
    b: blended.b / totalWeight,
  };

  const neutralMix = Math.min(1, (minDist / influenceRadius) ** 1.35);
  const softened = lerpRgb(blended, NEUTRAL_CREAM, neutralMix);
  return rgbToHex(softened);
}
