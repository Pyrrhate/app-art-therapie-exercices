import { getDimensionLabel } from "./painting-theory";

const DIMENSION_LABELS: Record<string, string> = {
  primary: "Primaire",
  secondary: "Secondaire",
  tertiary: "Tertiaire",
  anchor: "Primaire",
  complement: "Secondaire",
  closure: "Tertiaire",
};

export function buildLocalColorMirror(payload: {
  mode: "turn" | "synthesis";
  chosen?: { label: string; dimensionId: string };
  history: Array<{ label: string; dimensionId: string }>;
}): string {
  const labels = payload.history.map((h) => h.label).join(", ");

  if (payload.mode === "synthesis") {
    return labels
      ? `Votre palette peinture (${labels}) est prête — primaire pour les masses, secondaire pour l'équilibre, tertiaire pour les accents.`
      : "Votre palette est prête — testez chaque teinte sur une bande d'essai avant de peindre.";
  }

  const chosen = payload.chosen?.label ?? "cette teinte";
  const dim = getDimensionLabel(payload.chosen?.dimensionId ?? "");
  return `${chosen} (${dim}) rejoint votre palette — pensez au ratio 60·30·10 selon le rôle de chaque teinte.`;
}

export { DIMENSION_LABELS };
