import type { ArtisticTechnique } from "@/lib/types";
import { getTechniqueLabel } from "@/constants";
import type { FilEntry } from "./types";

/** Nombre max de traces (chemin BYOK / premium). */
export const PRACTICE_CONTEXT_MAX_ENTRIES = 5;
/** Nombre max en freemium (prompts HF plus courts). */
export const PRACTICE_CONTEXT_MAX_ENTRIES_COMPACT = 3;
/** Plafond caractères pour le freemium. */
export const PRACTICE_CONTEXT_MAX_CHARS_COMPACT = 1400;

export interface PracticeContextOptions {
  /** Filtrer préférentiellement la même technique. */
  technique?: ArtisticTechnique | null;
  maxEntries?: number;
  /** Résumés plus courts — adapté au mode gratuit (HF). */
  compact?: boolean;
  maxChars?: number;
}

/**
 * Construit un résumé court des traces du Fil pour le miroir créatif.
 * Opt-in côté UI — n'envoie que des extraits, jamais les photos.
 */
export function buildPracticeContextFromFil(
  entries: FilEntry[],
  options: PracticeContextOptions = {}
): string {
  const compact = Boolean(options.compact);
  const max =
    options.maxEntries ??
    (compact ? PRACTICE_CONTEXT_MAX_ENTRIES_COMPACT : PRACTICE_CONTEXT_MAX_ENTRIES);
  const maxChars =
    options.maxChars ??
    (compact ? PRACTICE_CONTEXT_MAX_CHARS_COMPACT : 4000);

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

  const summaryLen = compact ? 80 : 120;
  const impulseLen = compact ? 80 : 120;
  const exerciseLen = compact ? 100 : 180;
  const reflectionLen = compact ? 140 : 280;

  const blocks = picked.map((entry, index) => {
    const m = entry.metadata;
    const lines = [
      `Trace ${index + 1} — ${entry.summary.slice(0, summaryLen)}`,
      m?.technique
        ? `Technique : ${getTechniqueLabel(m.technique)}`
        : null,
      m?.impulse ? `Impulsion : ${m.impulse.slice(0, impulseLen)}` : null,
      !compact && m?.exercise
        ? `Consigne (extrait) : ${m.exercise.slice(0, exerciseLen)}`
        : null,
      m?.reflection
        ? `Miroir (extrait) : ${m.reflection.slice(0, reflectionLen)}`
        : entry.detail
          ? `Note : ${entry.detail.slice(0, compact ? 120 : 200)}`
          : null,
    ].filter(Boolean);
    return lines.join("\n");
  });

  const text = [
    "Échos du Fil créatif (traces locales — croiser avec douceur, au conditionnel, sans diagnostic) :",
    blocks.join("\n\n---\n\n"),
  ].join("\n\n");

  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}

export function countUsableFilTraces(entries: FilEntry[]): number {
  return entries.filter(
    (e) =>
      Boolean(e.summary?.trim()) ||
      Boolean(e.metadata?.reflection?.trim()) ||
      Boolean(e.detail?.trim())
  ).length;
}
