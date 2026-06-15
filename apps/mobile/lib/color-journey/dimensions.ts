export const COLOR_JOURNEY_DIMENSIONS = [
  {
    id: "anchor",
    title: "Ancrage",
    subtitle: "Ce qui vous tient en ce moment",
  },
  {
    id: "energy",
    title: "Énergie",
    subtitle: "Ce qui vous anime doucement",
  },
  {
    id: "softness",
    title: "Douceur",
    subtitle: "Ce qui vous enveloppe",
  },
  {
    id: "clarity",
    title: "Clarté",
    subtitle: "Ce qui éclaire votre regard",
  },
  {
    id: "depth",
    title: "Profondeur",
    subtitle: "Ce qui appelle à plonger",
  },
  {
    id: "joy",
    title: "Joie",
    subtitle: "Ce qui fait vibrer la lumière",
  },
  {
    id: "mystery",
    title: "Mystère",
    subtitle: "Ce qui reste à découvrir",
  },
  {
    id: "harmony",
    title: "Harmonie",
    subtitle: "Ce qui rassemble vos teintes",
  },
] as const;

export const COLOR_JOURNEY_TURN_COUNT = COLOR_JOURNEY_DIMENSIONS.length;

export function getDimensionForTurn(turn: number) {
  const index = Math.max(0, Math.min(turn - 1, COLOR_JOURNEY_TURN_COUNT - 1));
  return COLOR_JOURNEY_DIMENSIONS[index]!;
}
