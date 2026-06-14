import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TimerSoundId } from "./sounds";

const TIMER_SOUND_KEY = "@art_therapie/timer_sound";

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
