import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
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
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
    throw new Error("Fichier illisible — vérifiez qu'il s'agit d'une sauvegarde Art Thérapie.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Format de sauvegarde invalide.");
  }

  const backup = parsed as Partial<AppBackup>;

  if (backup.app !== BACKUP_APP_ID) {
    throw new Error("Ce fichier ne provient pas d'Art Thérapie.");
  }

  if (backup.version !== BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Version de sauvegarde non supportée (${String(backup.version)}). Mettez l'application à jour.`
    );
  }

  if (!backup.data || typeof backup.data !== "object") {
    throw new Error("Contenu de sauvegarde manquant.");
  }

  if (!Array.isArray(backup.data.creativeFil)) {
    throw new Error("Fil créatif invalide dans la sauvegarde.");
  }

  if (
    backup.data.ritualDraft !== null &&
    backup.data.ritualDraft !== undefined &&
    typeof backup.data.ritualDraft !== "object"
  ) {
    throw new Error("Brouillon de rituel invalide.");
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
    throw new Error("Préférences invalides dans la sauvegarde.");
  }

  return backup as AppBackup;
}
