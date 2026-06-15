import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import {
  DEFAULT_SAND_COLOR,
  type ZenGardenState,
} from "./types";

const DEFAULT_STATE: ZenGardenState = {
  strokes: [],
  rocks: [],
  sandColor: DEFAULT_SAND_COLOR,
  updatedAt: new Date().toISOString(),
};

export async function loadZenGarden(): Promise<ZenGardenState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.zenGarden);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as ZenGardenState;
    return {
      strokes: parsed.strokes ?? [],
      rocks: parsed.rocks ?? [],
      sandColor: parsed.sandColor ?? DEFAULT_SAND_COLOR,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveZenGarden(state: ZenGardenState): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.zenGarden,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function clearZenGardenStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.zenGarden);
}
