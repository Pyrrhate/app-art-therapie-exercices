import type { PrimarySource } from "./colors";
import type { ElementKind } from "./elements";

export type NuanceCellKind = "normal" | "element" | "lotus" | "primary";

export interface NuanceCell {
  id: string;
  row: number;
  col: number;
  kind: NuanceCellKind;
  isSource: boolean;
  revealColor: string;
  source: PrimarySource | null;
  elementKind?: ElementKind;
}

export interface NuanceGrid {
  seed: number;
  lotusId: string | null;
  lotusZoneIds: string[];
  cells: NuanceCell[][];
}
