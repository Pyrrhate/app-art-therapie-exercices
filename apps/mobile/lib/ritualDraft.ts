import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";
import type { RitualDuration } from "@/constants";

export type RitualDraftStep = "exercise" | "reflection";

export interface RitualDraft {
  impulse: string;
  technique: ArtisticTechnique;
  exercise: string;
  exerciseKeywords?: string[];
  durationMinutes: RitualDuration;
  step: RitualDraftStep;
  photoUri?: string | null;
  writtenText?: string;
  updatedAt: string;
}

export async function getRitualDraft(): Promise<RitualDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ritualDraft);
    if (!raw) return null;
    return JSON.parse(raw) as RitualDraft;
  } catch {
    return null;
  }
}

export async function saveRitualDraft(draft: RitualDraft): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ritualDraft, JSON.stringify(draft));
}

export async function clearRitualDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ritualDraft);
}
