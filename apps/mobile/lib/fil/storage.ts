import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { FilEntry } from "./types";

const MAX_ENTRIES = 60;

export async function getFilEntries(): Promise<FilEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.creativeFil);
    if (!raw) return [];
    return JSON.parse(raw) as FilEntry[];
  } catch {
    return [];
  }
}

export async function addFilEntry(
  entry: Omit<FilEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): Promise<FilEntry> {
  const full: FilEntry = {
    id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    source: entry.source,
    summary: entry.summary,
    detail: entry.detail,
    metadata: entry.metadata,
  };
  const existing = await getFilEntries();
  const next = [full, ...existing].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEYS.creativeFil, JSON.stringify(next));
  return full;
}

export async function clearFilEntries(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.creativeFil);
}
