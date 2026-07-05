/** Cinq dimensions — une teinte par tour, guidées par théories couleur et psychologie. */
export const COLOR_JOURNEY_DIMENSIONS = [
  {
    id: "anchor",
    title: "Ancrage",
    subtitle: "Votre première teinte, librement choisie",
    theoryLabel: "Intuition chromatique",
  },
  {
    id: "complement",
    title: "Complémentaire",
    subtitle: "L'opposée sur le cercle — tension vivifiante",
    theoryLabel: "Contraste complémentaire (Itten)",
  },
  {
    id: "analogous",
    title: "Analogues",
    subtitle: "Voisinage harmonique sur la roue",
    theoryLabel: "Harmonie analogue",
  },
  {
    id: "split",
    title: "Split-complémentaire",
    subtitle: "Contraste modéré, palette nuancée",
    theoryLabel: "Split-complémentaire",
  },
  {
    id: "triadic",
    title: "Triade & équilibre",
    subtitle: "Troisième pôle pour unir la palette",
    theoryLabel: "Triade + psychologie des couleurs",
  },
] as const;

export const COLOR_JOURNEY_TURN_COUNT = COLOR_JOURNEY_DIMENSIONS.length;

export function getDimensionForTurn(turn: number) {
  const index = Math.max(0, Math.min(turn - 1, COLOR_JOURNEY_TURN_COUNT - 1));
  return COLOR_JOURNEY_DIMENSIONS[index]!;
}
