import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import { replaceFilEntries } from "@/lib/fil/storage";
import { clearRitualDraft, saveRitualDraft } from "@/lib/ritualDraft";
import { setThemePreference, setTimerSound } from "@/lib/preferences";
import { useThemeStore } from "@/lib/themeStore";
import type { AppBackup } from "./types";

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

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

  await restoreOptionalKey(
    STORAGE_KEYS.mandalaProgress,
    backup.data.mandalaProgress
  );
  await restoreOptionalKey(
    STORAGE_KEYS.mandalaCustomPalette,
    backup.data.mandalaCustomPalette
  );
  await restoreOptionalKey(STORAGE_KEYS.zenGarden, backup.data.zenGarden);
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
