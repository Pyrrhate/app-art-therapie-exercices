export interface ColorProposal {
  hex: string;
  label: string;
  hint: string;
}

export interface ColorChoice {
  hex: string;
  label: string;
  dimensionId: string;
}

export interface JourneyReflection {
  reflection: string;
  psychology: string;
  theory: string;
  question?: string;
  turn: number;
  chosen: ColorProposal;
}

export interface JourneySynthesis {
  summary: string;
  suggestedImpulse: string;
  palette: ColorChoice[];
  source: "ai" | "fallback";
}

export type ColorJourneyPhase =
  | "intro"
  | "choosing"
  | "reflecting"
  | "complete";
