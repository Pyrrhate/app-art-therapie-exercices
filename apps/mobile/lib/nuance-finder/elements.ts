import type { Rgb } from "./colors";
import { NEUTRAL_CREAM, rgbToHex } from "./colors";

export type ElementKind = "earth" | "fire" | "water" | "air";

export interface ElementSource {
  kind: ElementKind;
  label: string;
  hex: string;
  rgb: Rgb;
  /** Quatre teintes déployées aux points cardinaux autour de la source */
  deploy: [string, string, string, string];
}

export const ELEMENTAL_SOURCES: ElementSource[] = [
  {
    kind: "earth",
    label: "Terre",
    hex: "#8B7355",
    rgb: { r: 139, g: 115, b: 85 },
    deploy: ["#6B5344", "#A0826D", "#C4A484", "#4A3728"],
  },
  {
    kind: "fire",
    label: "Feu",
    hex: "#E2552D",
    rgb: { r: 226, g: 85, b: 45 },
    deploy: ["#FF6B35", "#C04000", "#FFB347", "#8B2500"],
  },
  {
    kind: "water",
    label: "Eau",
    hex: "#5B9AA9",
    rgb: { r: 91, g: 154, b: 169 },
    deploy: ["#2E6B7A", "#87CEEB", "#4682B4", "#B0E0E6"],
  },
  {
    kind: "air",
    label: "Air",
    hex: "#9DB4C8",
    rgb: { r: 157, g: 180, b: 200 },
    deploy: ["#E8F4F8", "#A8C5DA", "#7EB6D4", "#F0F8FF"],
  },
];

export const LOTUS_SOURCE = {
  label: "Lotus",
  hex: "#F5E6F0",
  rgb: { r: 245, g: 230, b: 240 },
  clearColor: rgbToHex(NEUTRAL_CREAM),
};

/** N, E, S, O — indices 0..3 dans deploy */
const CARDINALS: Array<[dr: number, dc: number, deployIndex: number]> = [
  [-1, 0, 0],
  [0, 1, 1],
  [1, 0, 2],
  [0, -1, 3],
];

export function getDeployColorForCell(
  row: number,
  col: number,
  elements: Array<{ row: number; col: number; source: ElementSource }>
): string | null {
  for (const el of elements) {
    for (const [dr, dc, idx] of CARDINALS) {
      if (row === el.row + dr && col === el.col + dc) {
        return el.source.deploy[idx]!;
      }
    }
  }
  return null;
}

export function getLotusZoneIds(
  lotusRow: number,
  lotusCol: number,
  gridSize: number,
  radius = 2
): string[] {
  const ids: string[] = [];
  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      const d = Math.hypot(r - lotusRow, c - lotusCol);
      if (d > 0 && d <= radius) {
        ids.push(`${r}-${c}`);
      }
    }
  }
  ids.sort((a, b) => {
    const [ar, ac] = a.split("-").map(Number);
    const [br, bc] = b.split("-").map(Number);
    return (
      Math.hypot(ar! - lotusRow, ac! - lotusCol) -
      Math.hypot(br! - lotusRow, bc! - lotusCol)
    );
  });
  return ids;
}
