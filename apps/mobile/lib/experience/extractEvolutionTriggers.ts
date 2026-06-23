import type {
  EvolutionTriggers,
  IntegrationAnswers,
  Round1Data,
  Round1Snapshot,
} from "@/lib/experience/types";
import type { MultimodalUserAnswers } from "@/lib/multimodal/types";

const BLOCKAGE_PATTERNS = [
  /bloqu[ée]?/gi,
  /difficult[ée]/gi,
  /résistance/gi,
  /hésit/gi,
  /tension/gi,
  /peur/gi,
  /frustr/gi,
];

const THEME_COLOR_WORDS = [
  "rouge",
  "bleu",
  "vert",
  "jaune",
  "orange",
  "violet",
  "noir",
  "blanc",
  "gris",
  "rose",
  "marron",
  "ocre",
  "sombre",
  "lumineux",
  "clair",
];

const DEEPENING_PATTERNS = [
  /approfond/gi,
  /explorer/gi,
  /continuer/gi,
  /poursuiv/gi,
  /découvr/gi,
  /accueill/gi,
  /laisser/gi,
];

function uniqueTrimmed(items: string[], max = 5): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = item.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function extractSentencesMatching(
  text: string,
  patterns: RegExp[],
  max = 3
): string[] {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  const hits: string[] = [];
  for (const sentence of sentences) {
    if (patterns.some((p) => {
      p.lastIndex = 0;
      return p.test(sentence);
    })) {
      hits.push(sentence.slice(0, 120));
    }
    if (hits.length >= max) break;
  }
  return hits;
}

function extractColorThemes(reflection: string): string[] {
  const lower = reflection.toLowerCase();
  return THEME_COLOR_WORDS.filter((w) => lower.includes(w)).map(
    (w) => `Couleur : ${w}`
  );
}

export interface EvolutionSourceInput {
  reflection: string;
  openQuestions: string[];
  preAnswers?: MultimodalUserAnswers;
  postAnswers?: IntegrationAnswers;
  writtenText?: string;
}

/** Extraction heuristique côté client — sans appel IA supplémentaire. */
export function extractEvolutionTriggers(
  input: EvolutionSourceInput
): EvolutionTriggers {
  const reflection = input.reflection.trim();
  const openQuestions = input.openQuestions.filter((q) => q.trim());
  const pre = input.preAnswers;
  const post = input.postAnswers;

  const blockages = uniqueTrimmed([
    ...extractSentencesMatching(reflection, BLOCKAGE_PATTERNS),
    pre?.anchorMoment.trim()
      ? `Ancrage difficile : ${pre.anchorMoment.trim()}`
      : "",
  ]);

  const dominantThemes = uniqueTrimmed([
    ...extractColorThemes(reflection),
    pre?.emotionalWord.trim()
      ? `Émotion : ${pre.emotionalWord.trim()}`
      : "",
    post?.resonance.trim() ? `Résonance : ${post.resonance.trim()}` : "",
    ...openQuestions.slice(0, 2).map((q) => `Question : ${q.slice(0, 80)}`),
  ]);

  const deepeningGoals = uniqueTrimmed([
    ...extractSentencesMatching(reflection, DEEPENING_PATTERNS, 2),
    post?.intention.trim() ? `Intention : ${post.intention.trim()}` : "",
    post?.keeper.trim() ? `À garder : ${post.keeper.trim()}` : "",
    ...openQuestions.slice(-2),
  ]);

  const emotionalHighlights = uniqueTrimmed([
    pre?.emotionalWord.trim() ?? "",
    pre?.bodilyState.trim() ? `Corps : ${pre.bodilyState.trim()}` : "",
    post?.resonance.trim() ?? "",
    post?.keeper.trim() ?? "",
  ]);

  const summaryParts = [
    reflection.slice(0, 180),
    pre?.emotionalWord.trim(),
    post?.intention.trim(),
  ].filter(Boolean);

  return {
    ...(blockages.length ? { blockages } : {}),
    ...(dominantThemes.length ? { dominantThemes } : {}),
    ...(deepeningGoals.length ? { deepeningGoals } : {}),
    ...(emotionalHighlights.length ? { emotionalHighlights } : {}),
    rawSummary: summaryParts.join(" · ").slice(0, 320),
  };
}

export function buildRound1Snapshot(input: {
  exercise: string;
  reflection: string;
  openQuestions: string[];
  preAnswers?: MultimodalUserAnswers;
  postAnswers?: IntegrationAnswers;
  writtenText?: string;
  photoUri?: string | null;
import type { Round1Data, Round1Snapshot } from "@/lib/experience/types";
  return {
    exercise: input.exercise,
    reflection: input.reflection,
    openQuestions: input.openQuestions,
    preAnswers: input.preAnswers,
    postAnswers: input.postAnswers,
    writtenText: input.writtenText,
    photoUri: input.photoUri,
    evolutionTriggers: extractEvolutionTriggers({
      reflection: input.reflection,
      openQuestions: input.openQuestions,
      preAnswers: input.preAnswers,
      postAnswers: input.postAnswers,
      writtenText: input.writtenText,
    }),
  };
}

/** Convertit un snapshot vers le format historique Round1Data. */
export function round1SnapshotToData(
  snapshot: import("@/lib/experience/types").Round1Snapshot,
  reflectionSource: "ai" | "fallback" = "ai"
): import("@/lib/experience/types").Round1Data {
  return {
    media: snapshot.photoUri ?? "",
    writtenText: snapshot.writtenText,
    preAnswers: snapshot.preAnswers,
    aiAnalysis: snapshot.reflection,
    openQuestions: snapshot.openQuestions,
    reflectionSource,
    postAnswers: snapshot.postAnswers,
  };
}
