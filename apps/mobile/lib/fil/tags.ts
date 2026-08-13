import { getTechniqueLabel } from "@/constants";
import type { FilEntry } from "./types";

export const FIL_MAX_TAG_LENGTH = 24;
export const FIL_MAX_TAGS_PER_ENTRY = 8;

export function normalizeTag(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) return null;
  return trimmed.slice(0, FIL_MAX_TAG_LENGTH);
}

export function mergeTags(
  existing: string[] | undefined,
  extra: Array<string | null | undefined>
): string[] {
  const map = new Map<string, string>();
  for (const raw of [...(existing ?? []), ...extra]) {
    if (!raw) continue;
    const normalized = normalizeTag(raw);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!map.has(key)) map.set(key, normalized);
  }
  return [...map.values()].slice(0, FIL_MAX_TAGS_PER_ENTRY);
}

export function techniqueTag(entry: FilEntry): string | null {
  const label = entry.metadata?.techniqueLabel?.trim();
  if (label) return normalizeTag(label);
  if (entry.metadata?.technique) {
    return normalizeTag(getTechniqueLabel(entry.metadata.technique));
  }
  return null;
}

/** Tags affichés sur la mosaïque : technique, saison, tags utilisateur. */
export function visualTags(entry: FilEntry): string[] {
  return mergeTags(undefined, [
    techniqueTag(entry),
    entry.metadata?.seasonTitle,
    ...(entry.tags ?? []),
  ]);
}

export function collectFilterTags(entries: FilEntry[]): string[] {
  const map = new Map<string, string>();
  for (const entry of entries) {
    for (const tag of visualTags(entry)) {
      const key = tag.toLowerCase();
      if (!map.has(key)) map.set(key, tag);
    }
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, "fr"));
}

export function entryMatchesTag(entry: FilEntry, tag: string): boolean {
  const needle = tag.trim().toLowerCase();
  if (!needle) return true;
  return visualTags(entry).some((t) => t.toLowerCase() === needle);
}
