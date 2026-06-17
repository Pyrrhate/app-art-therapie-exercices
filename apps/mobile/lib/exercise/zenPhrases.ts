export const ZEN_TIMER_PHRASES = [
  "Respirez une fois, sans rien changer.",
  "La main peut ralentir — c'est normal.",
  "Pas de bon résultat à atteindre, seulement explorer.",
  "Si l'esprit vagabonde, revenez à la matière.",
  "Une ligne imparfaite vaut mieux qu'une attente parfaite.",
  "Laissez une couleur surprendre la suivante.",
  "Vous pouvez rester longtemps sur un détail minuscule.",
  "Le silence autour de vous fait partie de l'exercice.",
  "Observez ce qui émerge sans le corriger tout de suite.",
  "Votre rythme est le bon, ici et maintenant.",
  "Une pause d'un instant est toujours permise.",
  "La curiosité compte plus que la maîtrise.",
  "Accueillez ce qui vous semble étrange sur la page.",
  "Le geste peut être léger, presque effleurant.",
  "Ce qui compte, c'est d'être présent·e au processus.",
  "Vous pouvez changer d'échelle — zoomer ou élargir.",
  "Une tache, une forme, une trace : tout est valable.",
  "Revenez au corps : épaules, mâchoire, souffle.",
  "L'exercice continue même dans le doute.",
  "Terminer n'est pas l'objectif — créer l'est.",
  "Un détour visuel est une piste, pas une erreur.",
  "Faites confiance à ce qui vous attire sur le support.",
  "La lumière de la pièce fait partie de la palette.",
  "Vous pouvez recommencer une zone en douceur.",
  "Chaque minute creuse un peu plus l'attention.",
] as const;

export function pickRandomZenPhraseIndex(): number {
  return Math.floor(Math.random() * ZEN_TIMER_PHRASES.length);
}

export function nextZenPhraseIndex(current: number): number {
  return (current + 1) % ZEN_TIMER_PHRASES.length;
}
