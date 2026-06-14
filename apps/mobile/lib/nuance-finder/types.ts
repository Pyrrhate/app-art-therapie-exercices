import type { PrimarySource } from "./colors";

export interface NuanceCell {
  id: string;
  row: number;
  col: number;
  isSource: boolean;
  /** Couleur affichée à la révélation */
  revealColor: string;
  source: PrimarySource | null;
}

export interface NuanceGrid {
  seed: number;
  sourceCount: number;
  cells: NuanceCell[][];
}
