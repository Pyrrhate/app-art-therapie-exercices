import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import { clearFilEntries } from "@/lib/fil/storage";
import { clearRitualDraft } from "@/lib/ritualDraft";
import { setThemePreference, setTimerSound } from "@/lib/preferences";
import { useRitualStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";

const LEGACY_KEYS = [
  "@art_therapie/mandala_progress",
  "@art_therapie/mandala_custom_palette",
  "@art_therapie/zen_garden",
  "@art_therapie/fil_sessions_migrated",
] as const;

/** Efface toutes les données locales de l'application sur cet appareil. */
export async function clearAllLocalData(): Promise<void> {
  useRitualStore.getState().reset();
  await clearRitualDraft();
  await clearFilEntries();

  const keys = [
    ...Object.values(STORAGE_KEYS),
    ...LEGACY_KEYS,
    "@art_therapie/theme",
    "@art_therapie/timer_sound",
  ];

  await AsyncStorage.multiRemove([...new Set(keys)]);

  await setThemePreference("light");
  await setTimerSound("gong");
  useThemeStore.setState({ theme: "light" });
}
