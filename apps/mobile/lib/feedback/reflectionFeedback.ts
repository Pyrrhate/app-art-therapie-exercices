import AsyncStorage from "@react-native-async-storage/async-storage";

export type FeedbackRating = 1 | 2 | 3;

export function reflectionFeedbackStorageKey(sessionId: string): string {
  return `@pastek/reflection-feedback/${sessionId}`;
}

export interface StoredReflectionFeedback {
  rating: FeedbackRating;
  comment: string;
}

export async function getReflectionFeedback(
  sessionId: string
): Promise<StoredReflectionFeedback | null> {
  try {
    const raw = await AsyncStorage.getItem(reflectionFeedbackStorageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReflectionFeedback;
    if (!parsed?.rating) return null;
    return {
      rating: parsed.rating,
      comment: parsed.comment ?? "",
    };
  } catch {
    return null;
  }
}

/** Contexte à injecter dans une demande d'approfondissement selon le vote miroir. */
export function buildDeepenFeedbackContext(
  feedback: StoredReflectionFeedback | null
): string | null {
  if (!feedback) return null;

  const lines: string[] = [];
  if (feedback.rating === 1) {
    lines.push(
      `[Retour utilisateur — le miroir ne résonne pas assez]
Rectifier et ajuster le miroir : proposer une reformulation plus juste pour cette personne, sans répéter ce qui sonnait faux.`
    );
  } else if (feedback.rating === 2) {
    lines.push(
      `[Retour utilisateur — résonance partielle]
Affiner en tenant compte de ce qui a touché modérément ; corriger au besoin ce qui sonne inexact.`
    );
  } else {
    lines.push(
      `[Retour utilisateur — bonne résonance]
Approfondir en s'appuyant sur ce qui a déjà touché l'utilisateur.`
    );
  }

  const comment = feedback.comment.trim();
  if (comment) {
    lines.push(`Précision de l'utilisateur : « ${comment.slice(0, 500)} »`);
  }

  return lines.join("\n");
}
