import type { ArtisticTechnique } from "@/lib/types";
import type { Round1Snapshot } from "@/lib/experience/types";
import { formatPreAnalysisContext } from "@/lib/experience/formatPreAnalysisContext";

function formatTriggersBlock(snapshot: Round1Snapshot): string {
  const t = snapshot.evolutionTriggers;
  const lines: string[] = [];

  if (t.rawSummary) {
    lines.push(`Synthèse du 1er tour : ${t.rawSummary}`);
  }
  if (t.emotionalHighlights?.length) {
    lines.push(`Points émotionnels : ${t.emotionalHighlights.join(" ; ")}`);
  }
  if (t.dominantThemes?.length) {
    lines.push(`Thèmes dominants : ${t.dominantThemes.join(" ; ")}`);
  }
  if (t.blockages?.length) {
    lines.push(`Blocages ou tensions : ${t.blockages.join(" ; ")}`);
  }
  if (t.deepeningGoals?.length) {
    lines.push(`Axes d'approfondissement : ${t.deepeningGoals.join(" ; ")}`);
  }
  if (snapshot.openQuestions.length) {
    lines.push(
      `Questions ouvertes restées en suspens :\n${snapshot.openQuestions.map((q) => `· ${q}`).join("\n")}`
    );
  }
  if (snapshot.preAnswers) {
    const pre = formatPreAnalysisContext(snapshot.preAnswers);
    if (pre) lines.push(pre);
  }
  if (snapshot.postAnswers?.resonance.trim()) {
    lines.push(`Résonance : « ${snapshot.postAnswers.resonance.trim()} »`);
  }
  if (snapshot.postAnswers?.intention.trim()) {
    lines.push(`Intention : « ${snapshot.postAnswers.intention.trim()} »`);
  }
  if (snapshot.writtenText?.trim()) {
    lines.push(`Texte du 1er tour : « ${snapshot.writtenText.trim().slice(0, 400)} »`);
  }

  return lines.join("\n\n");
}

/** Prompt français pour générer un exercice augmenté (2e tour). */
export function generateAugmentedExercisePrompt(
  baseExercise: string,
  round1Data: Round1Snapshot
): string {
  const triggersBlock = formatTriggersBlock(round1Data);

  return `Tu es un art-thérapeute bienveillant·e. L'utilisateur·rice vient de réaliser un premier exercice :

« ${baseExercise.trim()} »

Voici ce qui est ressorti de ce premier tour (analyse, ressenti, questions) :

${triggersBlock}

Pour ce 2e tour, ne lui donne pas exactement la même consigne. Augmente et adapte l'exercice en tenant compte de ce qui a émergé : approfondir les thèmes sensibles, accueillir les blocages sans les forcer, proposer une variation de geste ou de matière qui fait suite naturellement au premier passage.

Consignes :
- Ton chaleureux, invitant, non jugeant
- 120 mots maximum pour l'exercice
- Pas de diagnostic clinique
- keywords : 3 à 5 courtes expressions (2 à 4 mots chacune)

Réponds UNIQUEMENT en JSON valide, sans markdown :
{"exercise":"texte de l'exercice augmenté","durationMinutes":15,"keywords":["mot1","mot2","mot3"]}`;
}

export interface AugmentedExerciseRequest {
  impulse: string;
  technique: ArtisticTechnique;
  durationMinutes?: number;
  augmentationContext: string;
}

/** Corps API pour la génération d'exercice augmenté. */
export function buildAugmentedExerciseRequest(
  impulse: string,
  technique: ArtisticTechnique,
  round1Data: Round1Snapshot,
  durationMinutes?: number
): AugmentedExerciseRequest {
  return {
    impulse,
    technique,
    durationMinutes,
    augmentationContext: generateAugmentedExercisePrompt(
      round1Data.exercise,
      round1Data
    ),
  };
}
