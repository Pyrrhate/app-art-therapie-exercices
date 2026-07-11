/** Trois étapes — palette peinture RYB (primaire → secondaire → tertiaire). */
export const COLOR_JOURNEY_DIMENSIONS = [
  {
    id: "primary",
    title: "Couleur primaire",
    subtitle: "Votre teinte dominante — rouge, jaune ou bleu",
    theoryLabel: "Primaires RYB (peinture)",
  },
  {
    id: "secondary",
    title: "Couleur secondaire",
    subtitle: "Obtenue en mélangeant deux primaires",
    theoryLabel: "Orange, vert ou violet",
  },
  {
    id: "tertiary",
    title: "Couleur tertiaire",
    subtitle: "Nuance d'accord entre votre primaire et secondaire",
    theoryLabel: "Tertiaires (ex. rouge-orange, bleu-vert)",
  },
] as const;

export const COLOR_JOURNEY_TURN_COUNT = COLOR_JOURNEY_DIMENSIONS.length;

export function getDimensionForTurn(turn: number) {
  const index = Math.max(0, Math.min(turn - 1, COLOR_JOURNEY_TURN_COUNT - 1));
  return COLOR_JOURNEY_DIMENSIONS[index]!;
}
