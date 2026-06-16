import {
  COLOR_JOURNEY_TURN_COUNT,
  getDimensionForTurn,
} from "./dimensions";
import type { ColorChoice, ColorProposal } from "./types";

const FALLBACK_PROPOSALS: Record<string, ColorProposal[]> = {
  anchor: [
    { hex: "#527058", label: "Forêt profonde", hint: "Stabilité et racines" },
    { hex: "#A8856A", label: "Terre chaude", hint: "Solidité apaisante" },
    { hex: "#6B8F71", label: "Sauge ancrée", hint: "Présence calme" },
  ],
  energy: [
    { hex: "#E8A84A", label: "Ambre doux", hint: "Chaleur contenue" },
    { hex: "#C45C4A", label: "Corail feu", hint: "Élan créatif" },
    { hex: "#FFD700", label: "Or pâle", hint: "Lumière intérieure" },
  ],
  softness: [
    { hex: "#D4C4B5", label: "Brume rosée", hint: "Enveloppement" },
    { hex: "#E8DDD4", label: "Sable tendre", hint: "Douceur tactile" },
    { hex: "#8FA88A", label: "Sauge claire", hint: "Respiration" },
  ],
  clarity: [
    { hex: "#FAF7F4", label: "Crème lumineuse", hint: "Espace ouvert" },
    { hex: "#FFFFFF", label: "Perle", hint: "Transparence" },
    { hex: "#00CED1", label: "Cyan clair", hint: "Fraîcheur mentale" },
  ],
  depth: [
    { hex: "#4A5568", label: "Bleu nuit", hint: "Intériorité" },
    { hex: "#527058", label: "Vert profond", hint: "Mystère végétal" },
    { hex: "#6B5B95", label: "Violet brume", hint: "Rêverie" },
  ],
  joy: [
    { hex: "#FFD700", label: "Soleil pâle", hint: "Éclat léger" },
    { hex: "#FF1493", label: "Fuchsia doux", hint: "Joie vibrante" },
    { hex: "#E8A84A", label: "Miel", hint: "Douceur ensoleillée" },
  ],
  mystery: [
    { hex: "#6B5B95", label: "Améthyste", hint: "Intuition" },
    { hex: "#4A5568", label: "Crépuscule", hint: "Seuil" },
    { hex: "#527058", label: "Mousse", hint: "Secret vivant" },
  ],
  harmony: [
    { hex: "#6B8F71", label: "Sauge harmonie", hint: "Équilibre" },
    { hex: "#D4C4B5", label: "Brume unie", hint: "Accord des teintes" },
    { hex: "#A8856A", label: "Terre et ciel", hint: "Synthèse chaleureuse" },
  ],
};

function proposalsForTurn(turn: number): ColorProposal[] {
  const dim = getDimensionForTurn(turn);
  return [...(FALLBACK_PROPOSALS[dim.id] ?? FALLBACK_PROPOSALS.anchor)];
}

export function fallbackStartColorJourney(context: {
  mood?: string;
  seedWord?: string;
}) {
  const dim = getDimensionForTurn(1);
  const mood = context.mood?.trim() || context.seedWord?.trim();
  return {
    intro: mood
      ? `Accueillons votre mot « ${mood.slice(0, 40)} » — trois teintes vont dialoguer avec vous.`
      : "Trois invitations chromatiques vous attendent, à votre rythme.",
    turn: 1,
    dimension: dim,
    proposals: proposalsForTurn(1),
    contextNote: `${dim.title} — ${dim.subtitle}`,
    source: "fallback" as const,
  };
}

export function fallbackChooseColorJourney(input: {
  turn: number;
  chosen: ColorProposal;
  history: ColorChoice[];
}) {
  const dim = getDimensionForTurn(input.turn);
  const nextTurn = input.turn + 1;
  const response = {
    reflection: `${input.chosen.label} accueille une part de vous — laissez cette teinte résonner.`,
    psychology: `Des teintes proches de ${input.chosen.label.toLowerCase()} sont souvent liées à ${dim.subtitle.toLowerCase()}.`,
    theory: "Sur le cercle chromatique, cette nuance dialogue avec vos choix précédents.",
    question: "Où sentez-vous cette couleur en ce moment ?",
    source: "fallback" as const,
    nextTurn: undefined as number | undefined,
    nextDimension: undefined as ReturnType<typeof getDimensionForTurn> | undefined,
    proposals: undefined as ColorProposal[] | undefined,
    contextNote: undefined as string | undefined,
  };

  if (nextTurn <= COLOR_JOURNEY_TURN_COUNT) {
    const nextDim = getDimensionForTurn(nextTurn);
    response.nextTurn = nextTurn;
    response.nextDimension = nextDim;
    response.proposals = proposalsForTurn(nextTurn);
    response.contextNote = `${nextDim.title} — ${nextDim.subtitle}`;
  }

  return response;
}

export function fallbackSynthesizeColorJourney(input: {
  history: ColorChoice[];
}) {
  const labels = input.history.map((h) => h.label).join(", ");
  return {
    summary: `Votre palette intérieure tisse ${input.history.length} teintes — ${labels}.`,
    suggestedImpulse: `Palette intérieure : ${labels}`,
    palette: input.history,
    source: "fallback" as const,
  };
}
