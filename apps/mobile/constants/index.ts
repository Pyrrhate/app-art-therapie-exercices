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
} as const;

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
