export interface ColorProposal {
  hex: string;
  label: string;
  hint: string;
  mixRecipe?: string;
  paintId?: string;
}

export interface ColorChoice {
  hex: string;
  label: string;
  dimensionId: string;
  mixRecipe?: string;
  paintId?: string;
}

export interface JourneyReflection {
  reflection: string;
  psychology: string;
  theory: string;
  question?: string;
  mixRecipe?: string;
  turn: number;
  chosen: ColorProposal;
  aiMirror?: string;
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
