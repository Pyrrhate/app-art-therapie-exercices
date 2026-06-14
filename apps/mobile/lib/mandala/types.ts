export type MandalaTheme = "calm" | "energy" | "focus";

export interface MandalaPath {
  id: string;
  d: string;
}

export interface MandalaSpec {
  theme: MandalaTheme;
  viewBox: string;
  paths: MandalaPath[];
  seed: number;
}

export type MandalaFills = Record<string, string>;

export interface MandalaProgress {
  seed: number;
  fills: MandalaFills;
  selectedColor?: string;
}
