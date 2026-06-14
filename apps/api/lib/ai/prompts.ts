import { TECHNIQUE_LABELS } from "../techniques";
import type { ArtisticTechnique } from "../types";

export function buildExercisePrompt(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes = 15
): string {
  const label = TECHNIQUE_LABELS[technique];
  return `Tu es un·e art-thérapeute bienveillant·e. Rédige un exercice créatif court (120 mots max) en français.

Impulsion de l'utilisateur·rice : "${impulse}"
Technique choisie : ${label}
Durée prévue : ${durationMinutes} minutes (ne pas la modifier dans ta réponse)

Consignes :
- Ton chaleureux, non jugeant, invitant à l'exploration
- Pas de diagnostic ni d'interprétation psychologique
- Réponds UNIQUEMENT en JSON valide, sans markdown :
{"exercise":"texte de l'exercice ici","durationMinutes":${durationMinutes}}`;
}

export function buildReflectionPrompt(
  impulse?: string,
  technique?: ArtisticTechnique
): string {
  const context = [
    impulse ? `Impulsion initiale : "${impulse}"` : null,
    technique ? `Technique : ${TECHNIQUE_LABELS[technique]}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Tu es un miroir créatif empathique en art-thérapie. L'utilisateur·rice partage une photo de son œuvre.

${context}

En français uniquement :
1) Rédige un paragraphe (80 à 120 mots) décrivant ce que tu vois : couleurs, formes, textures, rythme. Sans diagnostic ni interprétation psychologique.
2) Puis ajoute une section « Questions » avec 2 ou 3 questions ouvertes et douces (une par ligne, préfixées par « - »).

Ne réponds pas en JSON. Pas de titre « REFLEXION ».`;
}

function normalizeRawAiResponse(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function extractJsonStringField(raw: string, field: string): string | null {
  const re = new RegExp(
    `"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`,
    "s"
  );
  const match = raw.match(re);
  if (!match?.[1]) return null;
  return unescapeJsonString(match[1]).trim();
}

function extractJsonStringArray(raw: string, field: string): string[] {
  const re = new RegExp(`"${field}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, "s");
  const match = raw.match(re);
  if (!match?.[1]) return [];

  const items: string[] = [];
  const itemRe = /"((?:\\.|[^"\\])*)"/g;
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemRe.exec(match[1])) !== null) {
    const text = unescapeJsonString(itemMatch[1]).trim();
    if (text) items.push(text);
  }
  return items;
}

function clampDuration(value: unknown, preferred?: number): number {
  if (preferred === 15 || preferred === 30 || preferred === 45) {
    return preferred;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 15;
  return Math.min(45, Math.max(5, Math.round(n)));
}

/** Détecte les réponses JSON brutes ou mal formées affichables par erreur. */
export function looksLikeJsonArtifact(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^\{[\s\S]*\}$/.test(t)) return true;
  if (/"\s*(exercise|reflection|openQuestions|durationMinutes)\s*"\s*:/.test(t)) {
    return true;
  }
  if (/^[,{\[\]":\s\d]+$/.test(t)) return true;
  return t.length < 12 && /[{}\[\]":,]/.test(t);
}

/** Nettoie le texte destiné à l'utilisateur·rice. */
export function cleanAiText(text: string): string {
  let result = normalizeRawAiResponse(text);

  result = result
    .replace(/^\{\s*"exercise"\s*:\s*"/i, "")
    .replace(/^\{\s*"reflection"\s*:\s*"/i, "")
    .replace(/"\s*,\s*"durationMinutes"\s*:\s*\d+\s*\}?\s*$/i, "")
    .replace(/"\s*,\s*"openQuestions"\s*:\s*\[[\s\S]*?\]\s*\}?\s*$/i, "")
    .replace(/"\s*\}\s*$/, "")
    .replace(/^\s*[,":{}\[\]]+\s*/, "")
    .trim();

  return unescapeJsonString(result).trim();
}

export function parseJsonFromText<T>(text: string): T | null {
  const normalized = normalizeRawAiResponse(text);
  const jsonMatch = normalized.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

export function parseExerciseFromAi(
  raw: string,
  preferredDuration?: number
): { exercise: string; durationMinutes: number } | null {
  const normalized = normalizeRawAiResponse(raw);
  const parsed = parseJsonFromText<{
    exercise?: unknown;
    durationMinutes?: unknown;
  }>(normalized);

  if (parsed && typeof parsed.exercise === "string") {
    const exercise = cleanAiText(parsed.exercise);
    if (exercise && !looksLikeJsonArtifact(exercise)) {
      return {
        exercise,
        durationMinutes: clampDuration(parsed.durationMinutes, preferredDuration),
      };
    }
  }

  const extracted = extractJsonStringField(normalized, "exercise");
  if (extracted) {
    const exercise = cleanAiText(extracted);
    if (exercise && !looksLikeJsonArtifact(exercise)) {
      const durationRaw = normalized.match(
        /"durationMinutes"\s*:\s*(\d+)/
      )?.[1];
      return {
        exercise,
        durationMinutes: clampDuration(durationRaw, preferredDuration),
      };
    }
  }

  const prose = cleanAiText(normalized);
  if (prose.length >= 20 && !looksLikeJsonArtifact(prose)) {
    return { exercise: prose, durationMinutes: clampDuration(15, preferredDuration) };
  }

  return null;
}

function parseReflectionFromProse(raw: string): {
  reflection: string;
  openQuestions: string[];
} | null {
  const normalized = normalizeRawAiResponse(raw);
  const lines = normalized.split("\n").map((l) => l.trim());

  const reflectionLines: string[] = [];
  const openQuestions: string[] = [];
  let inQuestions = false;

  for (const line of lines) {
    if (!line) continue;

    if (
      /^questions?\s*:?\s*$/i.test(line) ||
      /^#{1,3}\s*questions?\s*$/i.test(line)
    ) {
      inQuestions = true;
      continue;
    }

    const bullet = line.match(/^[-•*]\s+(.+)/);
    if (bullet) {
      const q = cleanAiText(bullet[1]!);
      if (q) openQuestions.push(q);
      inQuestions = true;
      continue;
    }

    if (inQuestions && line.endsWith("?")) {
      openQuestions.push(cleanAiText(line));
      continue;
    }

    if (!inQuestions) {
      reflectionLines.push(line);
    }
  }

  const reflection = cleanAiText(reflectionLines.join("\n\n"));
  if (reflection.length >= 20 && !looksLikeJsonArtifact(reflection)) {
    return {
      reflection,
      openQuestions: openQuestions.filter(
        (q) => q.length > 5 && !looksLikeJsonArtifact(q)
      ),
    };
  }

  return null;
}

export function parseReflectionFromAi(raw: string): {
  reflection: string;
  openQuestions: string[];
} | null {
  const normalized = normalizeRawAiResponse(raw);
  const parsed = parseJsonFromText<{
    reflection?: unknown;
    openQuestions?: unknown;
  }>(normalized);

  if (parsed && typeof parsed.reflection === "string") {
    const reflection = cleanAiText(parsed.reflection);
    if (reflection && !looksLikeJsonArtifact(reflection)) {
      const openQuestions = Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions
            .filter((q): q is string => typeof q === "string")
            .map((q) => cleanAiText(q))
            .filter((q) => q && !looksLikeJsonArtifact(q))
        : [];
      return { reflection, openQuestions };
    }
  }

  const reflectionExtracted = extractJsonStringField(normalized, "reflection");
  if (reflectionExtracted) {
    const reflection = cleanAiText(reflectionExtracted);
    if (reflection && !looksLikeJsonArtifact(reflection)) {
      const openQuestions = extractJsonStringArray(normalized, "openQuestions")
        .map((q) => cleanAiText(q))
        .filter((q) => q && !looksLikeJsonArtifact(q));
      return { reflection, openQuestions };
    }
  }

  const proseStructured = parseReflectionFromProse(raw);
  if (proseStructured) return proseStructured;

  const prose = cleanAiText(normalized);
  if (prose.length >= 40 && !looksLikeJsonArtifact(prose)) {
    return { reflection: prose, openQuestions: [] };
  }

  return null;
}
