import {
  blendCellColor,
  PRIMARY_SOURCES,
  type SourcePoint,
} from "./colors";
import { getLotusZoneIds, LOTUS_SOURCE } from "./elements";
import type { NuanceCell, NuanceGrid } from "./types";

export const GRID_SIZE = 8;

function cellId(row: number, col: number): string {
  return `${row}-${col}`;
}

function pickUniquePositions(
  count: number,
  rng: () => number
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  const used = new Set<string>();
  let guard = 0;

  while (positions.length < count && guard < 300) {
    guard += 1;
    const row = Math.floor(rng() * GRID_SIZE);
    const col = Math.floor(rng() * GRID_SIZE);
    const key = cellId(row, col);
    if (used.has(key)) continue;
    used.add(key);
    positions.push({ row, col });
  }

  return positions;
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Grille 8×8 chromatique — sources CMY + lotus optionnel (sans les 4 éléments). */
export function createNuanceGrid(seed = Date.now()): NuanceGrid {
  const rng = createRng(seed);

  const primaryPositions = pickUniquePositions(PRIMARY_SOURCES.length, rng);
  const primaries: SourcePoint[] = PRIMARY_SOURCES.map((source, i) => ({
    row: primaryPositions[i]!.row,
    col: primaryPositions[i]!.col,
    source: { hex: source.hex, rgb: source.rgb, label: source.label },
  }));

  const used = new Set(primaries.map((p) => cellId(p.row, p.col)));
  let lotusId: string | null = null;
  let lotusZoneIds: string[] = [];

  if (rng() > 0.4) {
    let lotusRow = 0;
    let lotusCol = 0;
    let lotusGuard = 0;
    do {
      lotusRow = Math.floor(rng() * GRID_SIZE);
      lotusCol = Math.floor(rng() * GRID_SIZE);
      lotusGuard += 1;
    } while (used.has(cellId(lotusRow, lotusCol)) && lotusGuard < 100);

    lotusId = cellId(lotusRow, lotusCol);
    lotusZoneIds = getLotusZoneIds(lotusRow, lotusCol, GRID_SIZE, 2);
    used.add(lotusId);
  }

  const sourceAt = new Map<string, "lotus" | "primary">();
  if (lotusId) {
    sourceAt.set(lotusId, "lotus");
  }
  for (const p of primaries) {
    sourceAt.set(cellId(p.row, p.col), "primary");
  }

  const cells: NuanceCell[][] = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const rowCells: NuanceCell[] = [];
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const id = cellId(row, col);
      const special = sourceAt.get(id);

      if (special === "lotus") {
        rowCells.push({
          id,
          row,
          col,
          kind: "lotus",
          isSource: true,
          revealColor: LOTUS_SOURCE.hex,
          source: null,
        });
      } else if (special === "primary") {
        const prim = primaries.find((p) => p.row === row && p.col === col)!;
        const primarySource = PRIMARY_SOURCES.find(
          (s) => s.hex === prim.source.hex
        )!;
        rowCells.push({
          id,
          row,
          col,
          kind: "primary",
          isSource: true,
          revealColor: primarySource.hex,
          source: primarySource,
        });
      } else {
        rowCells.push({
          id,
          row,
          col,
          kind: "normal",
          isSource: false,
          revealColor: blendCellColor(row, col, primaries),
          source: null,
        });
      }
    }
    cells.push(rowCells);
  }

  return {
    seed,
    lotusId,
    lotusZoneIds,
    cells,
  };
}

export function flattenGrid(grid: NuanceGrid): NuanceCell[] {
  return grid.cells.flat();
}

export function findCell(grid: NuanceGrid, id: string): NuanceCell | undefined {
  return flattenGrid(grid).find((c) => c.id === id);
}
