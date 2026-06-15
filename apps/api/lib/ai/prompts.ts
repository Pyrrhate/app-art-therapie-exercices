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

export function buildVisionObservationPrompt(
  isWriting = false,
  exercise?: string
): string {
  const writingField = isWriting
    ? ',"texte_manuscrit":"transcription approximative ou vide"'
    : "";
  const exerciseBlock = exercise?.trim()
    ? `\n\nConsigne d'exercice que l'utilisateur·rice devait suivre — évaluez factuellement si l'image semble correspondre (sans juger la qualité) :\n« ${exercise.trim().slice(0, 900)} »`
    : "";
  return `Observe cette création artistique telle qu'elle apparaît réellement — ne décrivez que ce qui est visible.${exerciseBlock}

Répondez UNIQUEMENT en JSON valide :
{"couleurs":"teintes dominantes et contrastes réellement visibles","formes":"formes et composition observées","traits":"geste, ligne, matière perçus","ambiance":"atmosphère générale","emotions_visibles":"qualités affectives suggérées (sans diagnostic)","matiere":"textures ou medium perçu","accord_exercice":"fort|partiel|faible|incertain|sans_exercice — lien entre l'image et la consigne si fournie"${writingField}}

Notes factuelles internes — pas d'adresse à l'auteur·rice. Ne pas inventer d'éléments absents. Français.`;
}

export function buildHandwritingOcrPrompt(): string {
  return `Transcris fidèlement le texte manuscrit visible dans cette image, en français si possible.
Retourne UNIQUEMENT le texte transcrit, sans commentaire ni guillemets.
Si aucun texte lisible : retournez une chaîne vide.`;
}

export interface ReflectionPromptContext {
  visualNotes?: string;
  impulse?: string;
  technique?: ArtisticTechnique;
  exercise?: string;
  writtenText?: string;
  durationMinutes?: number;
}

function formatReflectionContext(ctx: ReflectionPromptContext): string {
  const lines = [
    ctx.impulse ? `Impulsion initiale : « ${ctx.impulse} »` : null,
    ctx.technique ? `Technique : ${TECHNIQUE_LABELS[ctx.technique]}` : null,
    ctx.durationMinutes
      ? `Durée du rituel : ${ctx.durationMinutes} minutes`
      : null,
    ctx.exercise
      ? `Exercice proposé (intitulé à prendre en compte — si l'image ou le texte ne semble pas le suivre, accueillez ce qui EST là sans reproche) :\n« ${ctx.exercise.slice(0, 1200)} »`
      : null,
    ctx.writtenText
      ? `Texte de l'utilisateur·rice (saisi ou transcrit) :\n« ${ctx.writtenText.slice(0, 4000)} »`
      : null,
    ctx.visualNotes
      ? `Observations visuelles (usage interne — ne pas recopier en liste) :\n${ctx.visualNotes.trim()}`
      : null,
  ].filter(Boolean);
  return lines.join("\n\n");
}

export function buildWarmReflectionPrompt(ctx: ReflectionPromptContext): string {
  const contextBlock = formatReflectionContext(ctx);

  return `Tu es un·e art-thérapeute chaleureux·se et profond·e, jamais clinicien·ne.

${contextBlock}

Rédigez un miroir créatif en français, vouvoiement (« vous »).

Structure OBLIGATOIRE — reflection = 3 ou 4 paragraphes courts séparés par \\n\\n (50 à 70 mots chacun, pas plus) :
1) Accueil du geste — ce qui est réellement visible ou écrit (priorité absolue aux observations visuelles)
2) Couleurs, formes, traits — tissés avec chaleur (pas de catalogue, pas d'invention)
3) Ambiance et émotions accueillies sans diagnostic
4) (Optionnel) Encouragement bref

Concision : une analyse plus courte vaut mieux qu'un long texte.

Fidélité : ne décrivez que ce qui est visible dans l'image ou le texte fourni. Si les observations indiquent un accord_exercice faible ou partiel avec la consigne, accueillez la création telle qu'elle est (« votre geste semble avoir pris un autre chemin que l'intitulé… ») puis parlez de ce qui est montré.

Si un texte écrit est fourni, accueillez aussi les mots et leur rythme.

Interdit : « L'œuvre présente », jargon d'expert, jugement sur la qualité artistique.

Ajoutez followUpExercise : une courte consigne d'exercice de suite (2-3 phrases) adaptée au vécu, pour approfondir ou apaiser — ton invitant.

2 ou 3 openQuestions sur le ressenti et le processus.

JSON uniquement :
{"reflection":"paragraphe1\\n\\nparagraphe2\\n\\nparagraphe3\\n\\nparagraphe4","openQuestions":["…","…"],"followUpExercise":"…"}`;
}

export function buildWarmReflectionRetryPrompt(
  failedReflection: string,
  ctx: ReflectionPromptContext
): string {
  const contextBlock = formatReflectionContext(ctx);
  return `La réponse ci-dessous est trop courte, froide ou inadéquate :

"""
${failedReflection.slice(0, 800)}
"""

${contextBlock}

Réécrivez : 3-4 paragraphes chaleureux (\\n\\n), vouvoiement, ancrés dans ce qui est RÉELLEMENT visible — pas d'invention. Si l'exercice n'a pas été suivi, accueillez la création montrée sans reproche.

JSON uniquement :
{"reflection":"…","openQuestions":["…"],"followUpExercise":"…"}`;
}

export function looksLikeColdDescription(text: string): boolean {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const coldPhrases = [
    "l'oeuvre presente",
    "dominent",
    "contrastant avec",
    "teintes profondes",
    "la texture parait",
    "les formes sont",
    "traces de pinceau",
    "le rythme est",
    "nuances de",
    "parsèment le fond",
    "parsement le fond",
  ];
  let hits = 0;
  for (const phrase of coldPhrases) {
    if (t.includes(phrase)) hits++;
  }
  return hits >= 3 || t.includes("l'oeuvre presente");
}

export function looksLikeTooBriefReflection(text: string): boolean {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return text.length < 220 || paragraphs.length < 2;
}

/** @deprecated Utiliser buildVisionObservationPrompt + buildWarmReflectionPrompt */
export function buildReflectionPrompt(
  impulse?: string,
  technique?: ArtisticTechnique
): string {
  return buildWarmReflectionPrompt({
    visualNotes: "(observez l'image directement)",
    impulse,
    technique,
  });
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
  followUpExercise?: string;
} | null {
  const normalized = normalizeRawAiResponse(raw);
  const parsed = parseJsonFromText<{
    reflection?: unknown;
    openQuestions?: unknown;
    followUpExercise?: unknown;
  }>(normalized);

  function pack(
    reflection: string,
    openQuestions: string[],
    followUpExercise?: string
  ) {
    const follow = followUpExercise
      ? cleanAiText(followUpExercise)
      : undefined;
    return {
      reflection,
      openQuestions,
      ...(follow && follow.length > 10 ? { followUpExercise: follow } : {}),
    };
  }

  if (parsed && typeof parsed.reflection === "string") {
    const reflection = cleanAiText(parsed.reflection);
    if (reflection && !looksLikeJsonArtifact(reflection)) {
      const openQuestions = Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions
            .filter((q): q is string => typeof q === "string")
            .map((q) => cleanAiText(q))
            .filter((q) => q && !looksLikeJsonArtifact(q))
        : [];
      const followUp =
        typeof parsed.followUpExercise === "string"
          ? parsed.followUpExercise
          : undefined;
      return pack(reflection, openQuestions, followUp);
    }
  }

  const reflectionExtracted = extractJsonStringField(normalized, "reflection");
  if (reflectionExtracted) {
    const reflection = cleanAiText(reflectionExtracted);
    if (reflection && !looksLikeJsonArtifact(reflection)) {
      const openQuestions = extractJsonStringArray(normalized, "openQuestions")
        .map((q) => cleanAiText(q))
        .filter((q) => q && !looksLikeJsonArtifact(q));
      const followUp = extractJsonStringField(normalized, "followUpExercise");
      return pack(reflection, openQuestions, followUp ?? undefined);
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
