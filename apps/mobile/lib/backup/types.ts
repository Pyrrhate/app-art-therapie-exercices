import type { FilEntry } from "@/lib/fil/types";
import type { RitualDraft } from "@/lib/ritualDraft";
import type { ThemePreference } from "@/lib/preferences";
import type { TimerSoundId } from "@/lib/sounds";

export const BACKUP_FORMAT_VERSION = 1 as const;
export const BACKUP_APP_ID = "art-therapie" as const;
export const BACKUP_FILE_EXTENSION = ".art-therapie.json";

export interface AppBackupV1 {
  version: typeof BACKUP_FORMAT_VERSION;
  app: typeof BACKUP_APP_ID;
  exportedAt: string;
  data: {
    creativeFil: FilEntry[];
    ritualDraft: RitualDraft | null;
    preferences: {
      theme: ThemePreference;
      timerSound: TimerSoundId;
    };
    mandalaProgress?: string | null;
    mandalaCustomPalette?: string | null;
    zenGarden?: string | null;
  };
}

export type AppBackup = AppBackupV1;

export interface BackupSummary {
  filCount: number;
  hasDraft: boolean;
  exportedAt: string;
  sizeBytes: number;
  sizeLabel: string;
}
