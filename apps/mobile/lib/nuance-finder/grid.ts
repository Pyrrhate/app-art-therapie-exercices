import {
  blendCellColor,
  PRIMARY_SOURCES,
  type SourcePoint,
} from "./colors";
import {
  ELEMENTAL_SOURCES,
  getDeployColorForCell,
  getLotusZoneIds,
  LOTUS_SOURCE,
} from "./elements";
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

export function createNuanceGrid(seed = Date.now()): NuanceGrid {
  const rng = createRng(seed);

  const elementPositions = pickUniquePositions(ELEMENTAL_SOURCES.length, rng);
  const elements = ELEMENTAL_SOURCES.map((source, i) => ({
    row: elementPositions[i]!.row,
    col: elementPositions[i]!.col,
    source,
  }));

  const used = new Set(elements.map((e) => cellId(e.row, e.col)));
  let lotusRow = 0;
  let lotusCol = 0;
  let lotusGuard = 0;
  do {
    lotusRow = Math.floor(rng() * GRID_SIZE);
    lotusCol = Math.floor(rng() * GRID_SIZE);
    lotusGuard += 1;
  } while (used.has(cellId(lotusRow, lotusCol)) && lotusGuard < 100);
  const lotusId = cellId(lotusRow, lotusCol);
  const lotusZoneIds = getLotusZoneIds(lotusRow, lotusCol, GRID_SIZE, 2);

  const optionalPrimaries: SourcePoint[] = [];
  if (rng() > 0.45) {
    let attempts = 0;
    while (optionalPrimaries.length < 2 && attempts < 80) {
      attempts += 1;
      const row = Math.floor(rng() * GRID_SIZE);
      const col = Math.floor(rng() * GRID_SIZE);
      const id = cellId(row, col);
      if (used.has(id) || lotusZoneIds.includes(id)) continue;
      used.add(id);
      const source = PRIMARY_SOURCES[Math.floor(rng() * PRIMARY_SOURCES.length)]!;
      optionalPrimaries.push({ row, col, source });
    }
  }

  const influencePoints: SourcePoint[] = [
    ...elements.map((e) => ({
      row: e.row,
      col: e.col,
      source: {
        label: e.source.label,
        hex: e.source.hex,
        rgb: e.source.rgb,
      },
    })),
    ...optionalPrimaries.map((p) => ({
      row: p.row,
      col: p.col,
      source: { hex: p.source.hex, rgb: p.source.rgb, label: p.source.label },
    })),
  ];

  const sourceAt = new Map<
    string,
    { kind: "element" | "lotus" | "primary"; elementKind?: typeof elements[0]["source"]["kind"] }
  >();
  for (const e of elements) {
    sourceAt.set(cellId(e.row, e.col), { kind: "element", elementKind: e.source.kind });
  }
  sourceAt.set(lotusId, { kind: "lotus" });
  for (const p of optionalPrimaries) {
    sourceAt.set(cellId(p.row, p.col), { kind: "primary" });
  }

  const cells: NuanceCell[][] = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const rowCells: NuanceCell[] = [];
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const id = cellId(row, col);
      const special = sourceAt.get(id);
      const deployColor = getDeployColorForCell(row, col, elements);

      if (special?.kind === "lotus") {
        rowCells.push({
          id,
          row,
          col,
          kind: "lotus",
          isSource: true,
          revealColor: LOTUS_SOURCE.hex,
          source: null,
        });
      } else if (special?.kind === "element") {
        const el = elements.find((e) => e.row === row && e.col === col)!;
        rowCells.push({
          id,
          row,
          col,
          kind: "element",
          isSource: true,
          revealColor: el.source.hex,
          source: null,
          elementKind: el.source.kind,
        });
      } else if (special?.kind === "primary") {
        const prim = optionalPrimaries.find((p) => p.row === row && p.col === col)!;
        rowCells.push({
          id,
          row,
          col,
          kind: "primary",
          isSource: true,
          revealColor: prim.source.hex,
          source: prim.source,
        });
      } else {
        rowCells.push({
          id,
          row,
          col,
          kind: "normal",
          isSource: false,
          revealColor: deployColor ?? blendCellColor(row, col, influencePoints),
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
