import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { SavedSession } from "@/lib/types";
import type { FilEntry } from "./types";

const MAX_ENTRIES = 80;
export const FIL_MAX_ENTRIES = MAX_ENTRIES;
export const FIL_NEAR_LIMIT_THRESHOLD = 70;
const MIGRATION_FLAG = "@art_therapie/fil_sessions_migrated";

export async function getFilEntries(): Promise<FilEntry[]> {
  await migrateLegacySessions();
  return getFilEntriesRaw();
}

export async function getFilEntryById(id: string): Promise<FilEntry | null> {
  const entries = await getFilEntries();
  return entries.find((e) => e.id === id) ?? null;
}

export async function addFilEntry(
  entry: Omit<FilEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): Promise<FilEntry> {
  await migrateLegacySessions();
  const full: FilEntry = {
    id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    source: entry.source,
    summary: entry.summary,
    detail: entry.detail,
    metadata: entry.metadata,
  };
  const existing = await getFilEntriesRaw();
  const next = [full, ...existing].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEYS.creativeFil, JSON.stringify(next));
  return full;
}

async function getFilEntriesRaw(): Promise<FilEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.creativeFil);
    if (!raw) return [];
    return JSON.parse(raw) as FilEntry[];
  } catch {
    return [];
  }
}

export async function deleteFilEntry(id: string): Promise<void> {
  const existing = await getFilEntriesRaw();
  await AsyncStorage.setItem(
    STORAGE_KEYS.creativeFil,
    JSON.stringify(existing.filter((e) => e.id !== id))
  );
}

export async function clearFilEntries(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.creativeFil);
}

export async function replaceFilEntries(entries: FilEntry[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.creativeFil,
    JSON.stringify(entries.slice(0, MAX_ENTRIES))
  );
}

function sessionToFilEntry(session: SavedSession): FilEntry {
  return {
    id: session.id,
    createdAt: session.createdAt,
    source: "ritual",
    summary: session.impulse || "Rituel créatif",
    detail: session.reflection?.slice(0, 280),
    metadata: {
      impulse: session.impulse,
      technique: session.technique,
      exercise: session.exercise,
      durationMinutes: session.durationMinutes,
      photoUri: session.photoUri,
      reflection: session.reflection,
      openQuestions: session.openQuestions,
      writtenText: session.writtenText,
      followUpExercise: session.followUpExercise,
    },
  };
}

/** Anciennes « sessions sauvegardées » → Fil créatif (une fois). */
async function migrateLegacySessions(): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_FLAG);
  if (done) return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
    if (!raw) {
      await AsyncStorage.setItem(MIGRATION_FLAG, "1");
      return;
    }

    const sessions = JSON.parse(raw) as SavedSession[];
    if (Array.isArray(sessions) && sessions.length > 0) {
      const existing = await getFilEntriesRaw();
      const migrated = sessions.map(sessionToFilEntry);
      const migratedIds = new Set(migrated.map((m) => m.id));
      const merged = [
        ...migrated,
        ...existing.filter((e) => !migratedIds.has(e.id)),
      ].slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(STORAGE_KEYS.creativeFil, JSON.stringify(merged));
    }

    await AsyncStorage.removeItem(STORAGE_KEYS.sessions);
    await AsyncStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    await AsyncStorage.setItem(MIGRATION_FLAG, "1");
  }
}
