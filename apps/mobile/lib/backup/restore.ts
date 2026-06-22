import AsyncStorage from "@react-native-async-storage/async-storage";
import { replaceFilEntries } from "@/lib/fil/storage";
import { clearRitualDraft, saveRitualDraft } from "@/lib/ritualDraft";
import { setThemePreference, setTimerSound } from "@/lib/preferences";
import { useThemeStore } from "@/lib/themeStore";
import type { AppBackup } from "./types";

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

/** Clés legacy (modules abandonnés) — restauration d'anciennes sauvegardes uniquement. */
const LEGACY_STORAGE_KEYS = {
  mandalaProgress: "@art_therapie/mandala_progress",
  mandalaCustomPalette: "@art_therapie/mandala_custom_palette",
  zenGarden: "@art_therapie/zen_garden",
} as const;

export async function restoreAppBackup(backup: AppBackup): Promise<void> {
  await replaceFilEntries(backup.data.creativeFil);

  if (backup.data.ritualDraft) {
    await saveRitualDraft(backup.data.ritualDraft);
  } else {
    await clearRitualDraft();
  }

  await setThemePreference(backup.data.preferences.theme);
  await setTimerSound(backup.data.preferences.timerSound);
  useThemeStore.setState({ theme: backup.data.preferences.theme });

  const legacy = backup.data as {
    mandalaProgress?: string | null;
    mandalaCustomPalette?: string | null;
    zenGarden?: string | null;
  };

  await restoreOptionalKey(LEGACY_STORAGE_KEYS.mandalaProgress, legacy.mandalaProgress);
  await restoreOptionalKey(
    LEGACY_STORAGE_KEYS.mandalaCustomPalette,
    legacy.mandalaCustomPalette
  );
  await restoreOptionalKey(LEGACY_STORAGE_KEYS.zenGarden, legacy.zenGarden);
}

async function restoreOptionalKey(
  key: string,
  value: string | null | undefined
): Promise<void> {
  if (value === null || value === undefined) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export function assertBackupSize(json: string): void {
  if (json.length > MAX_BACKUP_BYTES) {
    throw new Error(
      "Sauvegarde trop volumineuse (photos incluses). Réduisez le Fil ou exportez sans les plus anciennes traces."
    );
  }
}
