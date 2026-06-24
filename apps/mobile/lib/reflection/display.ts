import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";

function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/^[-•*]\s+/, "")
    .replace(/^(première|deuxième|troisième|1ère|2e|3e)\s+question\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/[?.!…]+$/g, "")
    .trim();
}

function questionsMatch(a: string, b: string): boolean {
  const na = normalizeQuestionText(a);
  const nb = normalizeQuestionText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.length > 24 && nb.length > 24 && (na.includes(nb) || nb.includes(na));
}

/** Retire les doublons tout en conservant l'ordre. */
export function extractEmbeddedQuestions(reflection: string): string[] {
  const found: string[] = [];

  for (const match of reflection.matchAll(
    /(?:Première|Deuxième|Troisième|1ère|2e|3e)\s+question\s*:\s*([^\n]+)/gi
  )) {
    const q = sanitizeAiDisplayText(match[1] ?? "");
    if (q.length > 5) found.push(q);
  }

  for (const match of reflection.matchAll(/^[-•*]\s+(.+\?)\s*$/gm)) {
    const q = sanitizeAiDisplayText(match[1] ?? "");
    if (q.length > 5) found.push(q);
  }

  return dedupeOpenQuestions(found);
}

export function resolveOpenQuestions(
  reflection: string,
  openQuestions: string[]
): string[] {
  const fromField = dedupeOpenQuestions(openQuestions);
  if (fromField.length > 0) return fromField;
  return extractEmbeddedQuestions(reflection);
}

function dedupeOpenQuestions(questions: string[]): string[] {
  const result: string[] = [];
  for (const raw of questions) {
    const q = sanitizeAiDisplayText(raw);
    if (q.length < 5) continue;
    if (result.some((existing) => questionsMatch(existing, q))) continue;
    result.push(q);
  }
  return result.slice(0, 3);
}

/** Corps de réflexion sans questions ni exercice de suite déjà affichés ailleurs. */
export function cleanReflectionBodyForDisplay(
  reflection: string,
  openQuestions: string[],
  followUpExercise?: string | null
): string {
  const deduped = dedupeOpenQuestions(openQuestions);

  const normalized = reflection
    .replace(/\r\n/g, "\n")
    .replace(/\n*(Première|Deuxième|Troisième)\s+question\s*:/gi, "\n\n$1 question :")
    .replace(/\n*followUpExercise\s*:/gi, "\n\nfollowUpExercise :");

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const kept = paragraphs.filter((paragraph) => {
    if (/^followUpExercise\s*:/i.test(paragraph)) return false;
    if (/^(Première|Deuxième|Troisième|1ère|2e|3e)\s+question\s*:/i.test(paragraph)) {
      return false;
    }
    if (deduped.some((q) => questionsMatch(paragraph, q))) return false;

    const bulletMatch = paragraph.match(/^[-•*]\s+(.+)/s);
    if (bulletMatch) {
      const inner = bulletMatch[1]!.trim();
      if (inner.endsWith("?") && deduped.some((q) => questionsMatch(inner, q))) {
        return false;
      }
    }

    const followRef =
      followUpExercise ?? extractEmbeddedFollowUp(paragraph) ?? undefined;
    if (followRef) {
      const followSnippet = followRef.slice(0, 48).trim();
      if (followSnippet.length > 12 && paragraph.includes(followSnippet)) {
        return false;
      }
    }

    return true;
  });

  return kept.join("\n\n").trim();
}

export function extractEmbeddedFollowUp(reflection: string): string | null {
  const match = reflection.match(/followUpExercise\s*:\s*(.+)/is);
  if (!match) return null;
  const raw = match[1]!
    .split(/\n\s*\n/)[0]!
    .replace(/^[«"'\s]+|[»"'\s]+$/g, "")
    .trim();
  const cleaned = sanitizeAiDisplayText(raw);
  return cleaned.length > 10 ? cleaned : null;
}

export function resolveFollowUpExercise(
  reflection: string,
  followUpExercise?: string | null
): string | null {
  const fromField = followUpExercise
    ? sanitizeAiDisplayText(followUpExercise)
    : "";
  if (fromField.length > 10) return fromField;
  return extractEmbeddedFollowUp(reflection);
}
