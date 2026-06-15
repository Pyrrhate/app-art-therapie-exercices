import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";

export async function setMandalaCustomPalette(colors: string[]): Promise<void> {
  const unique = [...new Set(colors.filter(Boolean))].slice(0, 12);
  if (unique.length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEYS.mandalaCustomPalette);
    return;
  }
  await AsyncStorage.setItem(
    STORAGE_KEYS.mandalaCustomPalette,
    JSON.stringify(unique)
  );
}

export async function getMandalaCustomPalette(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.mandalaCustomPalette);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearMandalaCustomPalette(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.mandalaCustomPalette);
}
