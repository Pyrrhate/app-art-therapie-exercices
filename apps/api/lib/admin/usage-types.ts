export const AI_USAGE_EVENT_TYPES = [
  "exercise_generate",
  "exercise_augment",
  "exercise_creative_tips",
  "reflection_analyze",
  "reflection_ocr",
  "ping_pong",
] as const;

export type AiUsageEventType = (typeof AI_USAGE_EVENT_TYPES)[number];

export const AI_USAGE_EVENT_LABELS: Record<AiUsageEventType, string> = {
  exercise_generate: "Exercices générés",
  exercise_augment: "Exercices augmentés (2e tour)",
  exercise_creative_tips: "Pistes créatives",
  reflection_analyze: "Analyses / miroirs IA",
  reflection_ocr: "OCR écriture manuscrite",
  ping_pong: "Ping-pong associatif",
};
