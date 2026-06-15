import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { SavedSession } from "./types";

export async function getSessions(): Promise<SavedSession[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export async function saveSession(session: SavedSession): Promise<void> {
  const existing = await getSessions();
  existing.unshift(session);
  await AsyncStorage.setItem(
    STORAGE_KEYS.sessions,
    JSON.stringify(existing.slice(0, 100))
  );
}

export async function getSessionById(id: string): Promise<SavedSession | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

export async function deleteSession(id: string): Promise<void> {
  const existing = await getSessions();
  await AsyncStorage.setItem(
    STORAGE_KEYS.sessions,
    JSON.stringify(existing.filter((s) => s.id !== id))
  );
}
