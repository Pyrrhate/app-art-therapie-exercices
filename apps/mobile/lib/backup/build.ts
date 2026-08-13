import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import i18n from "@/lib/i18n";
import { getFilEntries } from "@/lib/fil/storage";
import { getRitualDraft } from "@/lib/ritualDraft";
import { getThemePreference, getTimerSound } from "@/lib/preferences";
import {
  BACKUP_APP_ID,
  BACKUP_FORMAT_VERSION,
  type AppBackup,
  type BackupSummary,
} from "./types";

export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return i18n.t("common:sizes.bytes", { n: bytes });
  if (bytes < 1024 * 1024) {
    return i18n.t("common:sizes.kb", { n: (bytes / 1024).toFixed(1) });
  }
  return i18n.t("common:sizes.mb", {
    n: (bytes / (1024 * 1024)).toFixed(1),
  });
}

export async function buildAppBackup(): Promise<AppBackup> {
  const [creativeFil, ritualDraft, theme, timerSound] = await Promise.all([
    getFilEntries(),
    getRitualDraft(),
    getThemePreference(),
    getTimerSound(),
  ]);

  return {
    version: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_ID,
    exportedAt: new Date().toISOString(),
    data: {
      creativeFil,
      ritualDraft,
      preferences: { theme, timerSound },
    },
  };
}

export function summarizeBackup(json: string): BackupSummary {
  const backup = parseAppBackupJson(json);
  return {
    filCount: backup.data.creativeFil.length,
    hasDraft: Boolean(backup.data.ritualDraft),
    exportedAt: backup.exportedAt,
    sizeBytes: json.length,
    sizeLabel: formatBackupSize(json.length),
  };
}

export function parseAppBackupJson(json: string): AppBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(i18n.t("app:settings.backupUnreadable"));
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(i18n.t("app:settings.backupInvalidFormat"));
  }

  const backup = parsed as Partial<AppBackup>;

  if (backup.app !== BACKUP_APP_ID) {
    throw new Error(i18n.t("app:settings.backupWrongApp"));
  }

  if (backup.version !== BACKUP_FORMAT_VERSION) {
    throw new Error(
      i18n.t("app:settings.backupUnsupportedVersion", {
        version: String(backup.version),
      })
    );
  }

  if (!backup.data || typeof backup.data !== "object") {
    throw new Error(i18n.t("app:settings.backupMissingData"));
  }

  if (!Array.isArray(backup.data.creativeFil)) {
    throw new Error(i18n.t("app:settings.backupInvalidFil"));
  }

  if (
    backup.data.ritualDraft !== null &&
    backup.data.ritualDraft !== undefined &&
    typeof backup.data.ritualDraft !== "object"
  ) {
    throw new Error(i18n.t("app:settings.backupInvalidDraft"));
  }

  const prefs = backup.data.preferences;
  if (
    !prefs ||
    typeof prefs !== "object" ||
    (prefs.theme !== "light" && prefs.theme !== "dark") ||
    (prefs.timerSound !== "gong" &&
      prefs.timerSound !== "chime" &&
      prefs.timerSound !== "none")
  ) {
    throw new Error(i18n.t("app:settings.backupInvalidPrefs"));
  }

  return backup as AppBackup;
}
