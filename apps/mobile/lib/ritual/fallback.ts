import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { deriveExerciseKeywords } from "@/lib/exercise/keywords";
import type { AppLanguage } from "@/lib/i18n/types";
import type { ArtisticTechnique, CreativeTipsResponse, ExerciseResponse } from "../types";

function resolveLanguage(language?: AppLanguage | string | null): AppLanguage {
  return language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

function performativeIntro(
  technique: ArtisticTechnique,
  language: AppLanguage
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
        return "Let the impulse guide your creative gesture";
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
      return "Laissez l'impulsion guider votre geste créatif";
  }
}

function visualIntro(technique: ArtisticTechnique, language: AppLanguage): string {
  if (language === "en") {
    return technique === "writing"
      ? "Let the impulse guide your writing, word by word"
      : "Begin with a shape or colour that calls you, even if it surprises you";
  }
  return technique === "writing"
    ? "Laissez l'impulsion guider votre écriture, mot après mot"
    : "Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend";
}

export function getFallbackExercise(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes?: number,
  language?: AppLanguage | string | null
): ExerciseResponse {
  const lang = resolveLanguage(language);
  const techniqueLabel = localizedTechniqueLabel(technique);
  const trimmedImpulse =
    impulse.trim() ||
    (lang === "en" ? "your impulse of the moment" : "votre impulsion du moment");
  const minutes = durationMinutes ?? 15;
  const isPerformative = ["video", "music", "dance", "theatre"].includes(
    technique
  );

  const intro = isPerformative
    ? performativeIntro(technique, lang)
    : visualIntro(technique, lang);

  const exercise =
    lang === "en"
      ? isPerformative
        ? `Take a moment to settle comfortably. Without judgement, let the impulse “${trimmedImpulse}” guide your ${techniqueLabel}.

${intro}. Explore for ${minutes} minutes, staying open to what emerges — without aiming for a perfect performance.

There is no right or wrong outcome — only your expression in this moment.`
        : `Take a moment to settle comfortably. Without judgement, let the impulse “${trimmedImpulse}” guide your ${techniqueLabel}.

${intro}. Work for ${minutes} minutes, staying curious about what emerges.

There is no right or wrong outcome — only your expression in this moment.`
      : isPerformative
        ? `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${trimmedImpulse} » guider votre ${techniqueLabel}.

${intro}. Explorez pendant ${minutes} minutes en restant à l'écoute de ce qui émerge — sans viser une performance parfaite.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`
        : `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${trimmedImpulse} » guider votre ${techniqueLabel}.

${intro}. Travaillez pendant ${minutes} minutes en restant curieux·se face à ce qui émerge.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`;

  const development =
    lang === "en"
      ? isPerformative
        ? `You may vary pace, intensity or point of view through the session. If a gesture surprises you, welcome it rather than correct it — that is often where exploration opens.`
        : `Notice one detail that draws you (texture, contrast, quiet between two marks) and let it grow without forcing the rest of the composition. Change scale once if the urge arises.`
      : isPerformative
        ? `Vous pouvez varier le rythme, l'intensité ou le point de vue au fil de la séance. Si un geste vous surprend, accueillez-le plutôt que de le corriger — c'est souvent là que l'exploration s'ouvre.`
        : `Précisez un détail qui vous attire (texture, contraste, silence entre deux traits) et laissez-le grandir sans forcer le reste de la composition. Changez d'échelle une fois si l'envie vient.`;

  return {
    exercise,
    development,
    durationMinutes: minutes,
    source: "fallback",
    keywords: deriveExerciseKeywords(impulse, technique, exercise),
  };
}

/** Exercice augmenté local quand l'API est indisponible (2e tour). */
export function getFallbackAugmentedExercise(
  impulse: string,
  technique: ArtisticTechnique,
  augmentationContext: string,
  durationMinutes?: number,
  language?: AppLanguage | string | null
): ExerciseResponse {
  const lang = resolveLanguage(language);
  const base = getFallbackExercise(impulse, technique, durationMinutes, lang);
  const themes = augmentationContext
    .split("\n")
    .filter(
      (l) =>
        l.includes("Thèmes") ||
        l.includes("Themes") ||
        l.includes("Émotion") ||
        l.includes("Emotion") ||
        l.includes("Intention")
    )
    .slice(0, 2)
    .join(" ");

  const augmented =
    lang === "en"
      ? `${base.exercise}

For this second pass, welcome what emerged in the first round${themes ? ` (${themes})` : ""}. Vary your gesture slightly: change scale, pace or material, without aiming for perfection — let the impulse guide a fresh exploration.`
      : `${base.exercise}

Pour ce second passage, accueillez ce qui a émergé lors du premier tour${themes ? ` (${themes})` : ""}. Variez légèrement votre geste : changez d'échelle, de rythme ou de matière, sans viser la perfection — laissez l'impulsion guider une nouvelle exploration.`;

  return {
    exercise: augmented,
    durationMinutes: base.durationMinutes,
    source: "fallback",
    keywords: deriveExerciseKeywords(impulse, technique, augmented),
  };
}

/** Pistes créatives locales si l'API est indisponible. */
export function getFallbackCreativeTips(
  impulse: string,
  technique: ArtisticTechnique,
  language?: AppLanguage | string | null
): CreativeTipsResponse {
  const lang = resolveLanguage(language);
  const word =
    impulse.trim() ||
    (lang === "en" ? "your impulse" : "votre impulsion");
  const label = localizedTechniqueLabel(technique);

  if (lang === "en") {
    return {
      tips: [
        `Let “${word}” open free associations — colours, textures, rhythms — without hunting for the “right” image.`,
        `If a symbol appears in your ${label}, hold it conditionally: it might evoke… rather than locking one meaning.`,
        `Vary one gesture or material quality (pressure, speed, scale) to extend the exploration without rewriting the brief.`,
      ],
      source: "fallback",
    };
  }

  return {
    tips: [
      `Laissez « ${word} » ouvrir des associations libres — couleurs, textures, rythmes — sans chercher la « bonne » image.`,
      `Si un symbole apparaît dans votre ${label}, accueillez-le au conditionnel : il pourrait évoquer… plutôt qu'imposer un sens fixe.`,
      `Variez un geste ou une qualité de matière (pression, vitesse, échelle) pour prolonger l'exploration sans refaire la consigne.`,
    ],
    source: "fallback",
  };
}
