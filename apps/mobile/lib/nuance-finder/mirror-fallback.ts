export function buildLocalNuanceMirror(payload: {
  colors: Array<{ label: string }>;
  harmonyName?: string;
  discoveredElements?: string[];
}): string {
  const names = payload.colors.map((c) => c.label).slice(0, 5).join(", ");
  const harmony = payload.harmonyName?.trim();

  if (harmony && names) {
    return `« ${harmony} » réunit ${names} — laissez cette harmonie infuser votre geste sans chercher la perfection.`;
  }
  if (names) {
    return `Vos teintes (${names}) forment une carte intérieure — accueillez ce que ces nuances éveillent en vous.`;
  }
  return "Votre grille révèle un paysage chromatique singulier — laissez ces nuances guider votre prochain geste.";
}
