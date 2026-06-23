import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { DeepSessionLog } from "@/lib/experience/types";

const MAX_LOGS = 80;

export async function getSessionLogs(): Promise<DeepSessionLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessionLogs);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeepSessionLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Enregistre un rituel profond complet dans le journal local. */
export async function saveSessionLog(log: DeepSessionLog): Promise<void> {
  const existing = await getSessionLogs();
  const next = [log, ...existing.filter((e) => e.id !== log.id)].slice(0, MAX_LOGS);
  await AsyncStorage.setItem(STORAGE_KEYS.sessionLogs, JSON.stringify(next));
}

export function createSessionLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
