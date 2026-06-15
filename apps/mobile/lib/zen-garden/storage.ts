import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import {
  createDefaultZenGardenState,
  ZEN_STATE_VERSION,
  type ZenGardenState,
} from "./types";

export async function loadZenGarden(): Promise<ZenGardenState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.zenGarden);
    if (!raw) return createDefaultZenGardenState();
    const parsed = JSON.parse(raw) as Partial<ZenGardenState> & { version?: number };
    if (!parsed.version || parsed.version < ZEN_STATE_VERSION) {
      return createDefaultZenGardenState();
    }
    return {
      version: ZEN_STATE_VERSION,
      sandPatches: parsed.sandPatches ?? [],
      waterBodies: parsed.waterBodies ?? [],
      pebbles: parsed.pebbles ?? [],
      sandColor: parsed.sandColor ?? createDefaultZenGardenState().sandColor,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return createDefaultZenGardenState();
  }
}

export async function saveZenGarden(state: ZenGardenState): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.zenGarden,
    JSON.stringify({
      ...state,
      version: ZEN_STATE_VERSION,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function clearZenGardenStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.zenGarden);
}
