import { deriveExerciseKeywords } from "./exercise-keywords";
import {
  TECHNIQUE_LABELS,
  isAiAnalysisSupported,
  techniqueLabelForLanguage,
} from "./techniques";
import type { ExerciseRequest, ExerciseResponse, ReflectionRequest } from "./types";

function resolveLanguage(language?: string | null): "fr" | "en" {
  return language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

function performativeIntro(
  technique: ExerciseRequest["technique"],
  language: "fr" | "en"
): string {
  if (language === "en") {
    switch (technique) {
      case "video":
        return "Let the impulse guide your frame, your shots and what you choose to show";
      case "music":
        return "Let the impulse guide the rhythm, sounds or melody you explore";
      case "dance":
        return "Let the impulse guide movement, the weight of the body and the space around you";
      case "theatre":
        return "Let the impulse guide voice, play and bodily presence";
      default:
        return "Begin with a shape or colour that calls you, even if it surprises you";
    }
  }
  switch (technique) {
    case "video":
      return "Laissez l'impulsion guider votre cadre, vos plans et ce que vous choisissez de montrer";
    case "music":
      return "Laissez l'impulsion guider le rythme, les sons ou la mélodie que vous explorez";
    case "dance":
      return "Laissez l'impulsion guider le mouvement, le poids du corps et l'espace autour de vous";
    case "theatre":
      return "Laissez l'impulsion guider la voix, le jeu et la présence corporelle";
    default:
      return "Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend";
  }
}

export function getFallbackExercise(input: ExerciseRequest): ExerciseResponse {
  const language = resolveLanguage(input.language);
  const technique = techniqueLabelForLanguage(input.technique, language);
  const impulse =
    input.impulse.trim() ||
    (language === "en" ? "your impulse of the moment" : "votre impulsion du moment");
  const durationMinutes = input.durationMinutes ?? 15;
  const isPerformative = !isAiAnalysisSupported(input.technique);

  const intro = isPerformative
    ? performativeIntro(input.technique, language)
    : language === "en"
      ? "Begin with a shape or colour that calls you, even if it surprises you"
      : "Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend";

  const middle =
    language === "en"
      ? isPerformative
        ? `${intro}. Explore for ${durationMinutes} minutes, staying open to what emerges — without aiming for a perfect performance.`
        : `${intro}. Work for ${durationMinutes} minutes, staying curious about what emerges.`
      : isPerformative
        ? `${intro}. Explorez pendant ${durationMinutes} minutes en restant à l'écoute de ce qui émerge — sans viser une performance parfaite.`
        : `${intro}. Travaillez pendant ${durationMinutes} minutes en restant curieux·se face à ce qui émerge.`;

  const exercise =
    language === "en"
      ? `Take a moment to settle comfortably. Without judgement, let the impulse “${impulse}” guide your ${technique}.

${middle}

There is no right or wrong outcome — only your expression in this moment.`
      : `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${impulse} » guider votre ${technique}.

${middle}

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`;

  const development =
    language === "en"
      ? isPerformative
        ? `You may vary pace, intensity or point of view. If a gesture surprises you, welcome it rather than correct it.`
        : `Notice one detail that draws you and let it grow without forcing the rest. Change scale once if the urge arises.`
      : isPerformative
        ? `Vous pouvez varier le rythme, l'intensité ou le point de vue. Si un geste vous surprend, accueillez-le plutôt que de le corriger.`
        : `Précisez un détail qui vous attire et laissez-le grandir sans forcer le reste. Changez d'échelle une fois si l'envie vient.`;

  return {
    exercise,
    development,
    durationMinutes,
    source: "fallback",
    keywords: deriveExerciseKeywords(input.impulse, input.technique, exercise),
  };
}

export function getFallbackReflection(input?: ReflectionRequest): {
  reflection: string;
  openQuestions: string[];
  followUpExercise?: string;
} {
  const impulse = input?.impulse?.trim();
  const exercise = input?.exercise?.trim();
  const technique = input?.technique
    ? TECHNIQUE_LABELS[input.technique]
    : null;

  const p1 =
    "Merci d'avoir pris ce temps pour créer. Votre geste, ici et maintenant, est déjà en soi une réponse douce à l'appel intérieur qui vous a guidé·e.";
  const p2 = impulse
    ? `En partant de « ${impulse} », vous avez laissé quelque chose prendre forme — couleurs, traces ou mots — avec votre propre rythme.`
    : "Quelque chose s'est déposé sur le papier ou la surface : une trace visible de ce moment, avec sa matière et son souffle.";
  const p3 = exercise
    ? "L'exercice que vous avez suivi a offert un cadre ; ce qui a émergé mérite d'être accueilli sans chercher à le corriger."
    : "Ce qui apparaît porte une ambiance qui vous appartient — accueillez-la avec curiosité plutôt qu'avec jugement.";
  const p4 =
    "Laissez-vous toucher·e par ce geste — il n'y a rien à réussir.";

  const followUp = technique
    ? `Reprenez ${technique === "Écriture" ? "l'écriture" : `votre ${technique.toLowerCase()}`} pendant dix minutes en repartant d'un détail qui vous a touché·e dans ce que vous venez de créer.`
    : "Prenez dix minutes pour approfondir un détail de votre création qui vous appelle encore.";

  return {
    reflection: [p1, p2, p3, p4].join("\n\n"),
    openQuestions: [
      "Qu'est-ce qui vous a le plus apaisé ou stimulé pendant ce rituel ?",
      "Y a-t-il une couleur, une forme ou un mot qui vous parle aujourd'hui ?",
      "Si vous pouviez remercier une part de vous pour ce geste, laquelle serait-ce ?",
    ],
    followUpExercise: followUp,
  };
}
