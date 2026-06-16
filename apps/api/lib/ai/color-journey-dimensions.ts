/** Trois dimensions actives : 3 choix humains, réflexion IA entre chaque tour. */
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
    id: "harmony",
    title: "Harmonie",
    subtitle: "Ce qui rassemble vos teintes",
  },
] as const;

export type ColorJourneyDimensionId =
  (typeof COLOR_JOURNEY_DIMENSIONS)[number]["id"];

export const COLOR_JOURNEY_TURN_COUNT = COLOR_JOURNEY_DIMENSIONS.length;

export function getDimensionForTurn(turn: number) {
  const index = Math.max(0, Math.min(turn - 1, COLOR_JOURNEY_TURN_COUNT - 1));
  return COLOR_JOURNEY_DIMENSIONS[index]!;
}
