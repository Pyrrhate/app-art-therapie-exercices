import { getTechniqueLabel } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";

export function getLocalReflection(input: {
  impulse?: string;
  exercise?: string;
  technique?: ArtisticTechnique | null;
  writtenText?: string;
}): {
  reflection: string;
  openQuestions: string[];
  followUpExercise?: string;
} {
  const impulse = input.impulse?.trim();
  const exercise = input.exercise?.trim();
  const technique = input.technique ?? null;
  const techniqueLabel = technique ? getTechniqueLabel(technique) : null;
  const isPerformative =
    technique &&
    ["video", "music", "dance", "theatre"].includes(technique);

  const p1 = isPerformative
    ? "Merci d'avoir pris ce temps pour explorer en mouvement, en son ou en jeu. Votre présence ici et maintenant compte — sans qu'une image ou une analyse extérieure ne vienne la juger."
    : "Merci d'avoir pris ce temps pour créer. Votre geste, ici et maintenant, est déjà en soi une réponse douce à l'appel intérieur qui vous a guidé·e.";

  const p2 = impulse
    ? isPerformative
      ? `En partant de « ${impulse} », vous avez laissé quelque chose s'incarner — dans le corps, la voix ou le temps — à votre rythme.`
      : `En partant de « ${impulse} », vous avez laissé quelque chose prendre forme — couleurs, traces ou mots — avec votre propre rythme.`
    : isPerformative
      ? "Quelque chose s'est joué dans l'instant : une énergie, un rythme, une intention — accueillez-la telle quelle."
      : "Quelque chose s'est déposé sur le papier ou la surface : une trace visible de ce moment, avec sa matière et son souffle.";

  const p3 = exercise
    ? "L'exercice que vous avez suivi a offert un cadre ; ce qui a émergé mérite d'être accueilli sans chercher à le corriger."
    : "Ce qui est apparu porte une ambiance qui vous appartient — accueillez-la avec curiosité plutôt qu'avec jugement.";

  const note = input.writtenText?.trim()
    ? "\n\nVos mots ci-dessus restent votre propre miroir — revenez-y quand vous le souhaitez."
    : "";

  const followUp = techniqueLabel
    ? isPerformative
      ? `Reprenez ${techniqueLabel.toLowerCase()} pendant dix minutes en repartant d'un geste, d'un son ou d'une intention qui vous a touché·e.`
      : `Reprenez ${techniqueLabel === "Écriture" ? "l'écriture" : `votre ${techniqueLabel.toLowerCase()}`} pendant dix minutes en repartant d'un détail qui vous a touché·e dans ce que vous venez de créer.`
    : "Prenez dix minutes pour approfondir un détail de votre création qui vous appelle encore.";

  const openQuestions = isPerformative
    ? [
        "Qu'est-ce qui a le plus vibré en vous pendant cet exercice ?",
        "Y a-t-il un geste, un son ou une image intérieure qui vous accompagne encore ?",
        "Si vous pouviez remercier une part de vous pour ce moment, laquelle serait-ce ?",
      ]
    : [
        "Qu'est-ce qui vous a le plus apaisé ou stimulé pendant ce rituel ?",
        "Y a-t-il une couleur, une forme ou un mot qui vous parle aujourd'hui ?",
        "Si vous pouviez remercier une part de vous pour ce geste, laquelle serait-ce ?",
      ];

  return {
    reflection: [p1, p2, p3, "Laissez-vous toucher·e par ce geste — il n'y a rien à réussir."].join(
      "\n\n"
    ) + note,
    openQuestions,
    followUpExercise: followUp,
  };
}
