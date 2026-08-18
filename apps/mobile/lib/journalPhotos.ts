import { useEffect, useState } from "react";
import { Platform } from "react-native";
import type { DeepSessionLog } from "@/lib/experience/types";
import { prepareImageDataUrl } from "@/lib/image";

export const JOURNAL_PHOTO_PREFIX = "idb:jp:";

const DB_NAME = "pastek-journal-photos";
const STORE = "photos";

export function isJournalPhotoRef(uri: string): boolean {
  return uri.startsWith(JOURNAL_PHOTO_PREFIX);
}

export function needsPhotoCompaction(uri: string): boolean {
  if (!uri || isJournalPhotoRef(uri)) return false;
  return uri.startsWith("data:") || uri.startsWith("blob:");
}

function needsPersist(uri: string): boolean {
  return needsPhotoCompaction(uri);
}

export function logsNeedPhotoCompaction(logs: DeepSessionLog[]): boolean {
  for (const log of logs) {
    for (const uri of log.privatePhotoUris ?? []) {
      if (needsPhotoCompaction(uri)) return true;
    }
    const r1 = log.sessionData?.round1?.media;
    const r2 = log.sessionData?.round2?.media;
    if (r1 && needsPhotoCompaction(r1)) return true;
    if (r2 && needsPhotoCompaction(r2)) return true;
  }
  return false;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB"));
  });
}

async function idbPut(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB put"));
  });
}

async function idbGet(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB get"));
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("FileReader"));
    reader.readAsDataURL(blob);
  });
}

/** Compresse et stocke une photo hors localStorage (IndexedDB sur web). */
export async function persistJournalPhoto(uri: string): Promise<string> {
  if (!uri || isJournalPhotoRef(uri) || !needsPersist(uri)) return uri;
  if (Platform.OS !== "web") return uri;

  const compressed = await prepareImageDataUrl(uri);
  const blob = await dataUrlToBlob(compressed);
  const id = `${JOURNAL_PHOTO_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await idbPut(id, blob);
  return id;
}

export async function persistJournalPhotos(uris: string[]): Promise<string[]> {
  const next: string[] = [];
  for (const uri of uris) {
    next.push(await persistJournalPhoto(uri));
  }
  return next;
}

export async function resolveJournalPhoto(uri: string): Promise<string> {
  if (!isJournalPhotoRef(uri) || Platform.OS !== "web") return uri;
  try {
    const blob = await idbGet(uri);
    if (!blob) return uri;
    return URL.createObjectURL(blob);
  } catch {
    return uri;
  }
}

export async function hydrateJournalPhotoForBackup(uri: string): Promise<string> {
  if (!isJournalPhotoRef(uri) || Platform.OS !== "web") return uri;
  const blob = await idbGet(uri);
  if (!blob) return uri;
  return blobToDataUrl(blob);
}

export function useResolvedPhotos(uris: string[]): string[] {
  const [resolved, setResolved] = useState(uris);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    void Promise.all(
      uris.map(async (uri) => {
        const next = await resolveJournalPhoto(uri);
        if (next !== uri && next.startsWith("blob:")) objectUrls.push(next);
        return next;
      })
    ).then((list) => {
      if (!cancelled) setResolved(list);
    });
    return () => {
      cancelled = true;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [uris.join("|")]);

  return resolved;
}

export async function compactHeavyUrisInLogs(
  logs: DeepSessionLog[]
): Promise<DeepSessionLog[]> {
  const next: DeepSessionLog[] = [];
  for (const log of logs) {
    const privatePhotoUris = await persistJournalPhotos(log.privatePhotoUris ?? []);
    let sessionData = log.sessionData;
    if (sessionData?.round1?.media && needsPersist(sessionData.round1.media)) {
      sessionData = {
        ...sessionData,
        round1: {
          ...sessionData.round1,
          media: await persistJournalPhoto(sessionData.round1.media),
        },
      };
    }
    if (sessionData?.round2?.media && needsPersist(sessionData.round2.media)) {
      sessionData = {
        ...sessionData,
        round2: {
          ...sessionData.round2,
          media: await persistJournalPhoto(sessionData.round2.media),
        },
      };
    }
    next.push({
      ...log,
      privatePhotoUris,
      sessionData,
      hasPhoto:
        privatePhotoUris.length > 0 ||
        Boolean(sessionData?.round1?.media) ||
        Boolean(sessionData?.round2?.media) ||
        log.hasPhoto,
    });
  }
  return next;
}

export async function hydrateSessionLogsForBackup(
  logs: DeepSessionLog[]
): Promise<DeepSessionLog[]> {
  const next: DeepSessionLog[] = [];
  for (const log of logs) {
    const privatePhotoUris = await Promise.all(
      (log.privatePhotoUris ?? []).map((uri) => hydrateJournalPhotoForBackup(uri))
    );
    let sessionData = log.sessionData;
    if (sessionData?.round1?.media) {
      sessionData = {
        ...sessionData,
        round1: {
          ...sessionData.round1,
          media: await hydrateJournalPhotoForBackup(sessionData.round1.media),
        },
      };
    }
    if (sessionData?.round2?.media) {
      sessionData = {
        ...sessionData,
        round2: {
          ...sessionData.round2,
          media: await hydrateJournalPhotoForBackup(sessionData.round2.media),
        },
      };
    }
    next.push({ ...log, privatePhotoUris, sessionData });
  }
  return next;
}
