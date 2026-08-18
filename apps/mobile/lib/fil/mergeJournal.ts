import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistJournalPhotos } from "@/lib/journalPhotos";
import { getSessionLogs } from "@/lib/sessionLog/storage";
import type { DeepSessionLog } from "@/lib/experience/types";
import {
  mergeLogOntoFilEntry,
  sessionLogToFilEntry,
} from "./fromSessionLog";
import {
  addFilEntry,
  getFilEntriesRawForMerge,
  patchFilEntry,
  replaceFilEntries,
} from "./storage";
import type { FilEntry } from "./types";

const JOURNAL_MERGE_FLAG = "@art_therapie/fil_journal_merged";

export async function upsertFilFromSessionLog(
  log: DeepSessionLog
): Promise<FilEntry> {
  const photos = await persistJournalPhotos(log.privatePhotoUris ?? []);
  const prepared: DeepSessionLog = { ...log, privatePhotoUris: photos };
  const linkedId = prepared.linkedFilEntryIds?.[0];
  if (linkedId) {
    const existing = (await getFilEntriesRawForMerge()).find(
      (entry) => entry.id === linkedId
    );
    if (existing) {
      const merged = mergeLogOntoFilEntry(existing, prepared);
      const updated = await patchFilEntry(existing.id, {
        detail: merged.detail,
        metadata: merged.metadata,
        summary: merged.summary,
      });
      if (updated) return updated;
    }
  }

  const asFil = sessionLogToFilEntry(prepared);
  const existingById = (await getFilEntriesRawForMerge()).find(
    (entry) =>
      entry.id === asFil.id || entry.metadata?.sessionLogId === prepared.id
  );
  if (existingById) {
    const merged = mergeLogOntoFilEntry(existingById, prepared);
    const updated = await patchFilEntry(existingById.id, {
      detail: merged.detail,
      metadata: merged.metadata,
      summary: merged.summary,
    });
    if (updated) return updated;
  }

  return addFilEntry(asFil);
}

export async function migrateJournalIntoFil(): Promise<void> {
  const done = await AsyncStorage.getItem(JOURNAL_MERGE_FLAG);
  if (done) return;

  try {
    const logs = await getSessionLogs();
    if (logs.length === 0) {
      await AsyncStorage.setItem(JOURNAL_MERGE_FLAG, "1");
      return;
    }

    let entries = await getFilEntriesRawForMerge();
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    for (const log of logs) {
      const photos = await persistJournalPhotos(log.privatePhotoUris ?? []);
      const prepared = { ...log, privatePhotoUris: photos };
      const linkedId = prepared.linkedFilEntryIds?.[0];
      const target =
        (linkedId ? byId.get(linkedId) : undefined) ??
        byId.get(prepared.id) ??
        [...byId.values()].find(
          (entry) => entry.metadata?.sessionLogId === prepared.id
        );

      if (target) {
        const merged = mergeLogOntoFilEntry(target, prepared);
        byId.set(target.id, merged);
      } else {
        const created = sessionLogToFilEntry(prepared);
        byId.set(created.id, created);
      }
    }

    entries = [...byId.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    await replaceFilEntries(entries);
    await AsyncStorage.setItem(JOURNAL_MERGE_FLAG, "1");
  } catch {
    await AsyncStorage.setItem(JOURNAL_MERGE_FLAG, "1");
  }
}
