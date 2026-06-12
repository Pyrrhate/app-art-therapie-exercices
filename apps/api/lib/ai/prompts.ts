import type { ArtisticTechnique } from "../types";

const TECHNIQUE_LABELS: Record<ArtisticTechnique, string> = {
  drawing: "dessin",
  painting: "peinture",
  writing: "écriture",
  mixed_media: "techniques mixtes",
  recyclart: "recycl'art",
};

export function buildExercisePrompt(
  impulse: string,
  technique: ArtisticTechnique
): string {
  const label = TECHNIQUE_LABELS[technique];
  return `Tu es un·e art-thérapeute bienveillant·e. Rédige un exercice créatif court (120 mots max) en français.

Impulsion de l'utilisateur·rice : "${impulse}"
Technique choisie : ${label}

Consignes :
- Ton chaleureux, non jugeant, invitant à l'exploration
- Pas de diagnostic ni d'interprétation psychologique
- Propose une durée suggérée entre 10 et 20 minutes
- Réponds UNIQUEMENT en JSON : {"exercise":"...","durationMinutes":15}`;
}

export function buildReflectionPrompt(
  impulse?: string,
  technique?: ArtisticTechnique
): string {
  const context = [
    impulse ? `Impulsion initiale : "${impulse}"` : null,
    technique ? `Technique : ${TECHNIQUE_LABELS[technique]}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Tu es un miroir créatif empathique. L'utilisateur·rice a terminé un exercice d'art-thérapie et partage une photo de son œuvre.

${context}

Décris ce que tu observes (couleurs, formes, textures) sans diagnostiquer. Pose 2 à 3 questions ouvertes et douces.

Réponds UNIQUEMENT en JSON :
{"reflection":"...","openQuestions":["...","..."]}`;
}

export function parseJsonFromText<T>(text: string): T | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
