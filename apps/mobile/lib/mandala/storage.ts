import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { MandalaProgress, MandalaTheme } from "./types";

type MandalaProgressStore = Partial<Record<MandalaTheme, MandalaProgress>>;

async function readStore(): Promise<MandalaProgressStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.mandalaProgress);
    if (!raw) return {};
    return JSON.parse(raw) as MandalaProgressStore;
  } catch {
    return {};
  }
}

export async function getMandalaProgress(
  theme: MandalaTheme
): Promise<MandalaProgress | null> {
  const store = await readStore();
  return store[theme] ?? null;
}

export async function saveMandalaProgress(
  theme: MandalaTheme,
  progress: MandalaProgress
): Promise<void> {
  const store = await readStore();
  store[theme] = progress;
  await AsyncStorage.setItem(
    STORAGE_KEYS.mandalaProgress,
    JSON.stringify(store)
  );
}

export async function clearMandalaProgress(theme: MandalaTheme): Promise<void> {
  const store = await readStore();
  delete store[theme];
  await AsyncStorage.setItem(
    STORAGE_KEYS.mandalaProgress,
    JSON.stringify(store)
  );
}

export function createMandalaSeed(): number {
  return Math.floor(Math.random() * 2147483646) + 1;
}
