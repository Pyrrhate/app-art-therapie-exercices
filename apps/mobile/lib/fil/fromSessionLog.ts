import type { DeepSessionLog } from "@/lib/experience/types";
import { isRenderableImageUri } from "@/components/journal/ImageLightbox";
import type { FilEntry } from "./types";

function uniqueUris(uris: Array<string | undefined | null>): string[] {
  const next: string[] = [];
  for (const uri of uris) {
    if (isRenderableImageUri(uri) && !next.includes(uri)) next.push(uri);
  }
  return next;
}

export function isManualJournalLog(log: DeepSessionLog): boolean {
  return Boolean(log.privateNotes?.trim()) && !log.sessionData?.round1?.aiAnalysis;
}

export function sessionLogToFilEntry(log: DeepSessionLog): FilEntry {
  const photos = uniqueUris([
    ...(log.privatePhotoUris ?? []),
    log.sessionData?.round1?.media,
    log.sessionData?.round2?.media,
  ]);
  const notes = log.privateNotes?.trim() ?? "";
  const reflection =
    log.sessionData?.round2?.aiAnalysis ??
    log.sessionData?.round1?.aiAnalysis ??
    log.aiReflection?.reflection;
  const note = isManualJournalLog(log);

  return {
    id: log.id,
    createdAt: log.createdAt,
    source: note ? "note" : "ritual",
    summary: log.exercise.impulse,
    detail: notes || reflection?.slice(0, 280),
    metadata: {
      impulse: log.exercise.impulse,
      technique: log.exercise.technique,
      techniqueLabel: log.exercise.techniqueLabel,
      exercise: log.exercise.exercise,
      durationMinutes: log.exercise.durationMinutes,
      photoUri: photos[0],
      reflection,
      writtenText: log.writtenText ?? log.sessionData?.round1?.writtenText,
      openQuestions:
        log.sessionData?.round2?.openQuestions ??
        log.sessionData?.round1?.openQuestions ??
        log.aiReflection?.openQuestions,
      privateNotes: notes,
      privatePhotoUris: log.privatePhotoUris ?? [],
      sessionLogId: log.id,
    },
  };
}

export function mergeLogOntoFilEntry(
  entry: FilEntry,
  log: DeepSessionLog
): FilEntry {
  const fromLog = sessionLogToFilEntry(log);
  const photos = uniqueUris([
    ...(entry.metadata?.privatePhotoUris ?? []),
    ...(fromLog.metadata?.privatePhotoUris ?? []),
    entry.metadata?.photoUri,
    fromLog.metadata?.photoUri,
  ]);
  const notes = [
    entry.metadata?.privateNotes?.trim(),
    fromLog.metadata?.privateNotes?.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    ...entry,
    detail: entry.detail || fromLog.detail,
    metadata: {
      ...fromLog.metadata,
      ...entry.metadata,
      privateNotes: notes,
      privatePhotoUris: photos.filter(
        (uri) => uri !== entry.metadata?.photoUri
      ),
      photoUri: entry.metadata?.photoUri || photos[0],
      sessionLogId: log.id,
    },
  };
}
