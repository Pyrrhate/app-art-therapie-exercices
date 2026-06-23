/** Canal d'expression choisi par l'utilisateur·rice. */
export type ExpressionMediaType = "visual" | "corporeal" | "sonic";

export type MultimodalWorkflowStep =
  | "media"
  | "questionnaire"
  | "upload"
  | "analyzing";

/** Réponses au questionnaire d'ancrage (étape 2). */
export interface MultimodalUserAnswers {
  emotionalWord: string;
  anchorMoment: string;
  bodilyState: string;
}

/** Contexte de l'exercice en cours (consigne, impulsion, etc.). */
export interface MultimodalExerciseContext {
  impulse: string;
  exercise: string;
  techniqueLabel?: string;
  durationMinutes?: number;
}

/** Fichier sélectionné pour l'analyse. */
export interface MultimodalMediaFile {
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  /** Data URL ou base64 prêt pour l'API (images web / natif). */
  payload?: string;
}

/** Payload complet envoyé à l'API d'analyse. */
export interface MultimodalAnalysisRequest {
  mediaType: ExpressionMediaType;
  exercise: MultimodalExerciseContext;
  answers: MultimodalUserAnswers;
  file: MultimodalMediaFile;
  prompt: string;
}

export const EMPTY_USER_ANSWERS: MultimodalUserAnswers = {
  emotionalWord: "",
  anchorMoment: "",
  bodilyState: "",
};
