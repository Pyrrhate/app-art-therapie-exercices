export type MandalaTheme = "calm" | "energy" | "focus";

export interface MandalaPath {
  id: string;
  d: string;
}

export interface MandalaSpec {
  theme: MandalaTheme;
  viewBox: string;
  paths: MandalaPath[];
}

export type MandalaFills = Record<string, string>;
