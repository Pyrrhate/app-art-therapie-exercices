import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { DeepSessionLog, SessionData } from "@/lib/experience/types";

const MAX_LOGS = 80;

function normalizeLog(log: DeepSessionLog): DeepSessionLog {
  if (log.sessionData) return log;
  if (!log.aiReflection) return log;
  return {
    ...log,
    sessionData: {
      exerciseId: log.id,
      round1: {
        media: log.hasPhoto ? "photo" : "",
        preAnswers: log.preAnalysis,
        aiAnalysis: log.aiReflection.reflection,
        postAnswers: log.postIntegration,
        writtenText: log.writtenText,
        openQuestions: log.aiReflection.openQuestions,
      },
    },
  };
}

export async function getSessionLogs(): Promise<DeepSessionLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessionLogs);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeepSessionLog[];
    return Array.isArray(parsed) ? parsed.map(normalizeLog) : [];
  } catch {
    return [];
  }
}

/** Enregistre un rituel profond complet dans le journal local. */
export async function saveSessionLog(log: DeepSessionLog): Promise<void> {
  const existing = await getSessionLogs();
  const next = [normalizeLog(log), ...existing.filter((e) => e.id !== log.id)].slice(
    0,
    MAX_LOGS
  );
  await AsyncStorage.setItem(STORAGE_KEYS.sessionLogs, JSON.stringify(next));
}

export function buildSessionDataPayload(
  sessionData: SessionData,
  logId: string
): DeepSessionLog["sessionData"] {
  return {
    ...sessionData,
    exerciseId: sessionData.exerciseId || logId,
  };
}

export function createSessionLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
