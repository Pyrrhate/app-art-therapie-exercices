export {
  DURATION_OPTIONS,
  TECHNIQUES,
  TECHNIQUE_LABELS,
  getTechniqueLabel,
  isAiAnalysisSupported,
  type RitualDuration,
  type TechniqueDefinition,
} from "@art-therapie/shared";

import { TECHNIQUES } from "@art-therapie/shared";

export const TECHNIQUES_WITHOUT_AI = TECHNIQUES.filter((t) => !t.aiAnalysis);

export const STORAGE_KEYS = {
  sessions: "@art_therapie/sessions",
  ritualDraft: "@art_therapie/ritual_draft",
  creativeFil: "@art_therapie/creative_fil",
  sessionLogs: "@art_therapie/session_logs",
  seasons: "@art_therapie/seasons_v1",
} as const;

export function formatSessionDate(
  iso: string,
  language: "fr" | "en" = "fr"
): string {
  const locale = language === "en" ? "en-GB" : "fr-FR";
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
