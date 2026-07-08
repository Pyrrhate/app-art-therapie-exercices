const DIMENSION_LABELS: Record<string, string> = {
  anchor: "Ancrage",
  complement: "Complémentaire",
  closure: "Équilibre",
};

export function buildLocalColorMirror(payload: {
  mode: "turn" | "synthesis";
  chosen?: { label: string; dimensionId: string };
  history: Array<{ label: string; dimensionId: string }>;
}): string {
  const labels = payload.history.map((h) => h.label).join(", ");

  if (payload.mode === "synthesis") {
    return labels
      ? `Votre trio chromatique (${labels}) forme un langage intérieur singulier — laissez ces teintes guider votre geste.`
      : "Votre palette est prête à devenir geste — accueillez ce qui émerge.";
  }

  const chosen = payload.chosen?.label ?? "cette teinte";
  const dim =
    DIMENSION_LABELS[payload.chosen?.dimensionId ?? ""] ?? "ce tour";
  return `${chosen} rejoint votre parcours (${dim}) — observez ce que cette couleur éveille en vous.`;
}
