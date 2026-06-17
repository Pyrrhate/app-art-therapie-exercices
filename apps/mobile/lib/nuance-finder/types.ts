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
  /** Case voisine d'un élément — teinte cardinale */
  deployFrom?: ElementKind;
}

export interface NuanceLotus {
  id: string;
  row: number;
  col: number;
  zoneIds: string[];
}

export interface NuanceGrid {
  seed: number;
  lotuses: NuanceLotus[];
  cells: NuanceCell[][];
}
