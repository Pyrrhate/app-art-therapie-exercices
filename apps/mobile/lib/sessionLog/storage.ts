import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "@/constants";
import type { DeepSessionLog, SessionData } from "@/lib/experience/types";
import {
  compactHeavyUrisInLogs,
  logsNeedPhotoCompaction,
} from "@/lib/journalPhotos";
import i18n from "@/lib/i18n";

const MAX_LOGS = 80;

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    name === "QuotaExceededError" ||
    message.toLowerCase().includes("quota") ||
    message.includes("exceeded")
  );
}

async function writeLogs(logs: DeepSessionLog[]): Promise<void> {
  const toStore =
    Platform.OS === "web" ? await compactHeavyUrisInLogs(logs) : logs;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.sessionLogs, JSON.stringify(toStore));
  } catch (error) {
    if (isQuotaError(error)) {
      throw new Error(i18n.t("journal:quotaExceeded"));
    }
    throw error;
  }
}

function normalizeLog(log: DeepSessionLog): DeepSessionLog {
  const base: DeepSessionLog = {
    ...log,
    privateNotes: log.privateNotes ?? "",
    privatePhotoUris: Array.isArray(log.privatePhotoUris)
      ? log.privatePhotoUris.filter((uri) => typeof uri === "string" && uri.trim().length > 0)
      : [],
    linkedFilEntryIds: Array.isArray(log.linkedFilEntryIds)
      ? log.linkedFilEntryIds.filter((id) => typeof id === "string" && id.trim().length > 0)
      : [],
  };
  if (log.sessionData) return base;
  if (!log.aiReflection) return base;
  return {
    ...base,
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
    const logs = Array.isArray(parsed) ? parsed.map(normalizeLog) : [];
    if (Platform.OS === "web" && logsNeedPhotoCompaction(logs)) {
      const compacted = await compactHeavyUrisInLogs(logs);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.sessionLogs,
          JSON.stringify(compacted)
        );
      } catch {
        /* Quota plein : on renvoie quand même la version compactée en mémoire. */
      }
      return compacted;
    }
    return logs;
  } catch {
    return [];
  }
}

export async function getSessionLogById(id: string): Promise<DeepSessionLog | null> {
  const logs = await getSessionLogs();
  return logs.find((log) => log.id === id) ?? null;
}

export async function deleteSessionLog(id: string): Promise<void> {
  const existing = await getSessionLogs();
  const next = existing.filter((e) => e.id !== id);
  await writeLogs(next);
}

/** Enregistre un rituel profond complet dans le journal local. */
export async function saveSessionLog(log: DeepSessionLog): Promise<void> {
  const existing = await getSessionLogs();
  const next = [normalizeLog(log), ...existing.filter((e) => e.id !== log.id)].slice(
    0,
    MAX_LOGS
  );
  await writeLogs(next);
  try {
    const { upsertFilFromSessionLog } = await import("@/lib/fil/mergeJournal");
    await upsertFilFromSessionLog(log);
  } catch {
    /* Le Fil reste la source principale ; un échec d'upsert ne bloque pas le log. */
  }
}

export async function patchSessionLog(
  id: string,
  patch: Partial<
    Pick<
      DeepSessionLog,
      | "privateNotes"
      | "privatePhotoUris"
      | "linkedFilEntryIds"
      | "exercise"
      | "postIntegration"
      | "hasPhoto"
    >
  >
): Promise<DeepSessionLog | null> {
  const logs = await getSessionLogs();
  const index = logs.findIndex((log) => log.id === id);
  if (index < 0) return null;
  const current = logs[index];
  const next = [...logs];
  next[index] = normalizeLog({
    ...current,
    ...patch,
    exercise: patch.exercise
      ? { ...current.exercise, ...patch.exercise }
      : current.exercise,
    postIntegration: patch.postIntegration
      ? { ...current.postIntegration, ...patch.postIntegration }
      : current.postIntegration,
  });
  await writeLogs(next);
  try {
    const { upsertFilFromSessionLog } = await import("@/lib/fil/mergeJournal");
    await upsertFilFromSessionLog(next[index]);
  } catch {
    /* ignore */
  }
  const stored = await getSessionLogById(id);
  return stored ?? next[index];
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
