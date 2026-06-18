import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TimerSoundId } from "./sounds";

const TIMER_SOUND_KEY = "@art_therapie/timer_sound";
const THEME_KEY = "@art_therapie/theme";

export type ThemePreference = "light" | "dark";

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // Préférence optionnelle
  }
  return "light";
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function getTimerSound(): Promise<TimerSoundId> {
  try {
    const value = await AsyncStorage.getItem(TIMER_SOUND_KEY);
    if (value === "gong" || value === "chime" || value === "none") {
      return value;
    }
  } catch {
    // Préférence optionnelle
  }
  return "gong";
}

export async function setTimerSound(id: TimerSoundId): Promise<void> {
  await AsyncStorage.setItem(TIMER_SOUND_KEY, id);
}
