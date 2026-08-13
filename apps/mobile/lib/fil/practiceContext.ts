import type { ArtisticTechnique } from "@/lib/types";
import { getTechniqueLabel } from "@/constants";
import type { FilEntry } from "./types";

/** Nombre max de traces envoyées au miroir longitudinal. */
export const PRACTICE_CONTEXT_MAX_ENTRIES = 5;

export interface PracticeContextOptions {
  /** Filtrer préférentiellement la même technique. */
  technique?: ArtisticTechnique | null;
  maxEntries?: number;
}

/**
 * Construit un résumé court des traces du Fil pour le miroir créatif.
 * Opt-in côté UI — n'envoie que des extraits, jamais les photos.
 */
export function buildPracticeContextFromFil(
  entries: FilEntry[],
  options: PracticeContextOptions = {}
): string {
  const max = options.maxEntries ?? PRACTICE_CONTEXT_MAX_ENTRIES;
  if (!entries.length || max <= 0) return "";

  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const preferred = options.technique
    ? sorted.filter((e) => e.metadata?.technique === options.technique)
    : [];
  const pool =
    preferred.length > 0
      ? [
          ...preferred,
          ...sorted.filter((e) => e.metadata?.technique !== options.technique),
        ]
      : sorted;

  const picked = pool.slice(0, max);
  if (picked.length === 0) return "";

  const blocks = picked.map((entry, index) => {
    const m = entry.metadata;
    const lines = [
      `Trace ${index + 1} — ${entry.summary.slice(0, 120)}`,
      m?.technique
        ? `Technique : ${getTechniqueLabel(m.technique)}`
        : null,
      m?.impulse ? `Impulsion : ${m.impulse.slice(0, 120)}` : null,
      m?.exercise
        ? `Consigne (extrait) : ${m.exercise.slice(0, 180)}`
        : null,
      m?.reflection
        ? `Miroir (extrait) : ${m.reflection.slice(0, 280)}`
        : entry.detail
          ? `Note : ${entry.detail.slice(0, 200)}`
          : null,
    ].filter(Boolean);
    return lines.join("\n");
  });

  return [
    "Échos du Fil créatif (traces locales récentes — croiser avec douceur, au conditionnel, sans diagnostic) :",
    blocks.join("\n\n---\n\n"),
  ].join("\n\n");
}

export function countUsableFilTraces(entries: FilEntry[]): number {
  return entries.filter(
    (e) =>
      Boolean(e.summary?.trim()) ||
      Boolean(e.metadata?.reflection?.trim()) ||
      Boolean(e.detail?.trim())
  ).length;
}
