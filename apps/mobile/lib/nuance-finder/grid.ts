import {
  blendCellColor,
  PRIMARY_SOURCES,
  type PrimarySource,
  type SourcePoint,
} from "./colors";
import type { NuanceCell, NuanceGrid } from "./types";

export const GRID_SIZE = 8;
export const MIN_SOURCES = 3;
export const MAX_SOURCES = 5;

function cellId(row: number, col: number): string {
  return `${row}-${col}`;
}

function pickSourceCount(rng: () => number): number {
  const span = MAX_SOURCES - MIN_SOURCES + 1;
  return MIN_SOURCES + Math.floor(rng() * span);
}

function pickUniquePositions(
  count: number,
  rng: () => number
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  const used = new Set<string>();
  let guard = 0;

  while (positions.length < count && guard < 200) {
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

function pickSourceColor(rng: () => number): PrimarySource {
  const index = Math.floor(rng() * PRIMARY_SOURCES.length);
  return PRIMARY_SOURCES[index]!;
}

/** Générateur simple seedé pour des grilles reproductibles au « Recommencer » si besoin. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function createNuanceGrid(seed = Date.now()): NuanceGrid {
  const rng = createRng(seed);
  const sourceCount = pickSourceCount(rng);
  const positions = pickUniquePositions(sourceCount, rng);

  const sources: SourcePoint[] = positions.map(({ row, col }) => ({
    row,
    col,
    source: pickSourceColor(rng),
  }));

  const sourceMap = new Map<string, PrimarySource>();
  for (const { row, col, source } of sources) {
    sourceMap.set(cellId(row, col), source);
  }

  const cells: NuanceCell[][] = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const rowCells: NuanceCell[] = [];
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const id = cellId(row, col);
      const source = sourceMap.get(id);

      if (source) {
        rowCells.push({
          id,
          row,
          col,
          isSource: true,
          revealColor: source.hex,
          source,
        });
      } else {
        rowCells.push({
          id,
          row,
          col,
          isSource: false,
          revealColor: blendCellColor(row, col, sources),
          source: null,
        });
      }
    }
    cells.push(rowCells);
  }

  return {
    seed,
    sourceCount: sources.length,
    cells,
  };
}

export function flattenGrid(grid: NuanceGrid): NuanceCell[] {
  return grid.cells.flat();
}
