import type { AppLanguage } from "@/lib/i18n/types";

const FR_PHRASES = [
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

const EN_PHRASES = [
  "Take one breath, changing nothing.",
  "Your hand may slow down — that is normal.",
  "There is no right result to reach, only exploring.",
  "If your mind wanders, come back to the material.",
  "An imperfect line beats a perfect expectation.",
  "Let one colour surprise the next.",
  "You may linger a long while on one tiny detail.",
  "The quiet around you is part of the exercise.",
  "Watch what emerges without correcting it straight away.",
  "Your pace is the right one, here and now.",
  "A moment's pause is always allowed.",
  "Curiosity matters more than mastery.",
  "Welcome whatever looks strange on the page.",
  "Your gesture can be light, barely grazing.",
  "What matters is being present to the process.",
  "You can change scale — zoom in or widen out.",
  "A mark, a shape, a trace: it all counts.",
  "Return to the body: shoulders, jaw, breath.",
  "The exercise continues, even through doubt.",
  "Finishing is not the aim — making is.",
  "A visual detour is a lead, not a mistake.",
  "Trust whatever draws you on the surface.",
  "The light in the room is part of your palette.",
  "You can gently begin an area again.",
  "Each minute deepens your attention a little more.",
] as const;

export const ZEN_TIMER_PHRASES_BY_LANGUAGE: Record<
  AppLanguage,
  readonly string[]
> = {
  fr: FR_PHRASES,
  en: EN_PHRASES,
};

/** Phrases par défaut (FR) — conservées pour les usages hors contexte i18n. */
export const ZEN_TIMER_PHRASES = FR_PHRASES;

export function getZenTimerPhrases(language?: string): readonly string[] {
  const lang = language?.slice(0, 2);
  return lang === "en" ? EN_PHRASES : FR_PHRASES;
}

export function pickRandomZenPhraseIndex(): number {
  return Math.floor(Math.random() * FR_PHRASES.length);
}

export function nextZenPhraseIndex(current: number): number {
  return (current + 1) % FR_PHRASES.length;
}
