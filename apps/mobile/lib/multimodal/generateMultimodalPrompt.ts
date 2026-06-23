import { MEDIA_TYPE_CONFIG } from "@/lib/multimodal/mediaConfig";
import type {
  ExpressionMediaType,
  MultimodalExerciseContext,
  MultimodalUserAnswers,
} from "@/lib/multimodal/types";

const MEDIA_ANALYSIS_HINT: Record<ExpressionMediaType, string> = {
  visual:
    "Observez la création visuelle : couleurs, gestes, matière, composition — sans interpréter à la place de l'auteur·rice.",
  corporeal:
    "Observez la performance corporelle : rythme, espace, qualité du mouvement, présence — sans juger la technique.",
  sonic:
    "Écoutez la création sonore : timbre, dynamique, respiration, silences — sans analyse musicologique froide.",
};

/**
 * Construit le prompt système + contexte pour l'analyse croisée multimodale.
 * À envoyer tel quel (ou comme message système) à l'API d'analyse.
 */
export function generateMultimodalPrompt(
  exerciseData: MultimodalExerciseContext,
  userAnswers: MultimodalUserAnswers,
  mediaType: ExpressionMediaType
): string {
  const mediaLabel = MEDIA_TYPE_CONFIG[mediaType].title;
  const analysisHint = MEDIA_ANALYSIS_HINT[mediaType];

  const contextLines = [
    exerciseData.impulse
      ? `Impulsion initiale : « ${exerciseData.impulse.trim()} »`
      : null,
    exerciseData.techniqueLabel
      ? `Technique : ${exerciseData.techniqueLabel}`
      : null,
    exerciseData.durationMinutes
      ? `Durée du rituel : ${exerciseData.durationMinutes} minutes`
      : null,
    exerciseData.exercise
      ? `Consigne de l'exercice (référence — ne pas la noter, croiser avec le vécu) :\n« ${exerciseData.exercise.trim().slice(0, 1500)} »`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const answersBlock = [
    `Ressenti émotionnel (mot de l'auteur·rice) : « ${userAnswers.emotionalWord.trim()} »`,
    `Point d'ancrage inattendu : « ${userAnswers.anchorMoment.trim()} »`,
    `État corporel maintenant : « ${userAnswers.bodilyState.trim()} »`,
  ].join("\n");

  return `Tu es un·e art-thérapeute bienveillant·e. Tu accompagnes une personne après un exercice créatif en ${mediaLabel}.

RÈGLES ABSOLUES :
- Ne pose JAMAIS de diagnostic clinique ni d'étiquette pathologique.
- Ne remplace pas le vécu de l'auteur·rice par une interprétation « experte ».
- Croise obligatoirement : (1) la consigne de l'exercice, (2) les trois réponses subjectives ci-dessous, (3) ce que tu perçois dans le média fourni.
- Si le média semble éloigné de la consigne, accueille ce qui EST là, sans reproche.
- Ton chaleureux, invitant, en français. Tutoiement doux ou vouvoiement selon « tu/vous » des réponses.
- Propose une réflexion en 2 à 4 courts paragraphes, puis 2 questions ouvertes pour approfondir (pas fermées oui/non).

${analysisHint}

--- CONTEXTE DE L'EXERCICE ---
${contextLines || "(non renseigné)"}

--- ANCRAGE SUBJECTIF DE L'AUTEUR·RICE ---
${answersBlock}

--- FORMAT DE RÉPONSE ---
Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "reflection": "texte de la réflexion croisée (2-4 paragraphes)",
  "openQuestions": ["question ouverte 1", "question ouverte 2"],
  "crossingNotes": "1 phrase interne sur le croisement consigne / ressenti / média (optionnel, bienveillant)"
}`;
}
