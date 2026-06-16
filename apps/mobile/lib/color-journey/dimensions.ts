/** Trois dimensions — une teinte par tour, guidées par la théorie des couleurs. */
export const COLOR_JOURNEY_DIMENSIONS = [
  {
    id: "anchor",
    title: "Ancrage",
    subtitle: "Votre première teinte, librement choisie",
  },
  {
    id: "energy",
    title: "Résonance",
    subtitle: "La complémentaire — opposée sur le cercle",
  },
  {
    id: "harmony",
    title: "Harmonie",
    subtitle: "La troisième teinte qui unit la palette",
  },
] as const;

export const COLOR_JOURNEY_TURN_COUNT = COLOR_JOURNEY_DIMENSIONS.length;

export function getDimensionForTurn(turn: number) {
  const index = Math.max(0, Math.min(turn - 1, COLOR_JOURNEY_TURN_COUNT - 1));
  return COLOR_JOURNEY_DIMENSIONS[index]!;
}
