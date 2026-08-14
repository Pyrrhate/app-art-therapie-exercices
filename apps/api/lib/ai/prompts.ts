import {
  resolvePromptText,
  type PromptOverrides,
} from "@art-therapie/shared";
import { sanitizeExerciseKeywords } from "../exercise-keywords";
import {
  TECHNIQUE_LABELS,
  techniqueLabelForLanguage,
} from "../techniques";
import type { ArtisticTechnique } from "../types";

export type PromptLanguage = "fr" | "en";

export function normalizePromptLanguage(
  language?: string | null
): PromptLanguage {
  return language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

/** @deprecated Préférer resolvePromptText("exercise_system") */
export const EXERCISE_SYSTEM = resolvePromptText("exercise_system");

/** @deprecated Préférer resolvePromptText("reflection_system") */
export const WARM_REFLECTION_SYSTEM = resolvePromptText("reflection_system");

/** System prompt exercice + contrainte de langue de sortie. */
export function resolveExerciseSystemPrompt(
  overrides?: PromptOverrides | null,
  language: PromptLanguage = "fr"
): string {
  const base = resolvePromptText("exercise_system", overrides);
  if (language === "en") {
    return `${base}

OUTPUT LANGUAGE (mandatory):
- Write every user-facing JSON field (exercise, development, keywords) in natural English.
- Warm second-person address (“you”).
- Do not answer in French unless the impulse itself is a French quote you briefly echo.`;
  }
  return `${base}

LANGUE DE SORTIE (obligatoire) :
- Rédigez tous les champs utilisateur du JSON (exercise, development, keywords) en français.
- Vouvoiement doux (« vous »).`;
}

export function buildExercisePrompt(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes = 15,
  augmentationContext?: string,
  language: PromptLanguage = "fr"
): string {
  const lang = normalizePromptLanguage(language);

  if (augmentationContext?.trim()) {
    const preferred = durationMinutes;
    if (lang === "en") {
      return `${augmentationContext.trim()}

Planned duration: ${preferred} minutes (do not change it in your JSON response).
Write exercise, development and keywords in English.`;
    }
    return `${augmentationContext.trim()}

Durée prévue : ${preferred} minutes (ne pas la modifier dans ta réponse JSON).`;
  }

  const label = techniqueLabelForLanguage(technique, lang);

  if (lang === "en") {
    return `USER CONTEXT:
- Starting impulse: “${impulse}”
- Chosen technique: ${label}
- Planned duration: ${durationMinutes} minutes (do not change it in your response)

EXPECTED RESPONSE FORMAT:
{"exercise":"creative brief text","development":"paragraph that develops the flow and possible variations","durationMinutes":${durationMinutes},"keywords":["phrase 1","phrase 2","phrase 3"]}

Write exercise, development and keywords in English.`;
  }

  return `CONTEXTE DE L'UTILISATEUR :
- Impulsion de départ : « ${impulse} »
- Technique choisie : ${label}
- Durée prévue : ${durationMinutes} minutes (ne pas la modifier dans votre réponse)

FORMAT DE RÉPONSE ATTENDU :
{"exercise":"texte de la consigne créative","development":"paragraphe qui développe le déroulé et les variations","durationMinutes":${durationMinutes},"keywords":["expression 1","expression 2","expression 3"]}`;
}

export function buildVisionObservationPrompt(
  isWriting = false,
  exercise?: string,
  overrides?: PromptOverrides | null
): string {
  const writingField = isWriting
    ? ',"texte_manuscrit":"transcription approximative ou vide"'
    : "";
  const exerciseBlock = exercise?.trim()
    ? `\n\nConsigne d'exercice que l'utilisateur·rice devait suivre — évaluez factuellement si l'image semble correspondre (sans juger la qualité) :\n« ${exercise.trim().slice(0, 900)} »`
    : "";
  const base = resolvePromptText("vision_observation", overrides);
  return `${base}${exerciseBlock}

Répondez UNIQUEMENT en JSON valide, en français :
{"couleurs":"teintes dominantes et contrastes réellement visibles","formes_et_composition":"formes, composition et occupation de l'espace observées","geste_et_energie":"geste, ligne, intensité du trait ou du geste perçus","matiere":"textures ou medium perçu","accord_exercice":"fort|partiel|faible|incertain|sans_exercice — lien factuel entre l'image et la consigne si fournie"${writingField}}

Notes : description interne pour alimenter un miroir créatif — pas d'adresse à l'auteur·rice.`;
}

export function buildHandwritingOcrPrompt(
  overrides?: PromptOverrides | null
): string {
  return resolvePromptText("handwriting_ocr", overrides);
}

export interface ReflectionPromptContext {
  visualNotes?: string;
  impulse?: string;
  technique?: ArtisticTechnique;
  exercise?: string;
  writtenText?: string;
  durationMinutes?: number;
  /** Parcours chromatique amont (palette, harmonie nuances). */
  colorContext?: string;
  /** Miroir créatif déjà reçu — à approfondir. */
  previousReflection?: string;
  /** Échos du Fil (traces locales récentes). */
  practiceContext?: string;
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
    ctx.colorContext
      ? `Parcours chromatique exploré avant la création (tisser un lien doux avec l'œuvre si pertinent — au conditionnel) :\n${ctx.colorContext.slice(0, 1500)}`
      : null,
    ctx.previousReflection
      ? `Miroir créatif déjà proposé (à approfondir — allez plus loin, sans répéter) :\n« ${ctx.previousReflection.slice(0, 2500)} »`
      : null,
    ctx.practiceContext
      ? `Mémoire de pratique (Fil local — croiser avec douceur, au conditionnel, sans dresser de profil psychologique) :\n${ctx.practiceContext.slice(0, 1600)}`
      : null,
  ].filter(Boolean);
  return lines.join("\n\n");
}

export function buildWarmReflectionPrompt(ctx: ReflectionPromptContext): string {
  const contextBlock = formatReflectionContext(ctx);
  const isDeepen = Boolean(ctx.previousReflection?.trim());
  const deepenHint = isDeepen
    ? `
Mode APPROFONDISSEMENT (obligatoire) :
- Le miroir précédent est fourni : partez de lui pour aller plus loin.
- Rédigez 3 ou 4 NOUVEAUX paragraphes (séparés par \\n\\n), substantiels (50 à 70 mots chacun).
- Ne recopiez pas le miroir précédent ; enrichissez la symbolique douce, le ressenti et les pistes créatives.
- Une image ou un nouveau texte n'est PAS requis pour approfondir : le miroir précédent suffit comme matière.
`
    : "";

  const fidelityHint = isDeepen
    ? `Ancrez-vous dans le miroir précédent et, s'ils sont fournis, dans l'image ou le texte. N'inventez pas d'éléments absents.`
    : `Fidélité : ne décrivez que ce qui est visible dans l'image ou le texte fourni. Si les observations indiquent un accord_exercice faible ou partiel, accueillez la création telle qu'elle est (« votre geste semble avoir pris un autre chemin que l'intitulé… ») puis parlez de ce qui est montré.

Si un texte écrit est fourni, accueillez aussi les mots et leur rythme.`;

  return `DONNÉES DE LA SÉANCE :
${contextBlock}
${deepenHint}
Avant de rédiger, vérifiez mentalement que votre ton n'est ni trop clinique, ni trop professoral — accueil chaleureux avant tout.

${fidelityHint}

Interdit : « L'œuvre présente », jargon d'expert, jugement sur la qualité artistique.

FORMAT DE RÉPONSE ATTENDU :
{"reflection":"3 ou 4 paragraphes séparés par \\n\\n — accueil du geste, lien doux aux couleurs/formes, symbolique au conditionnel, encouragement bref","openQuestions":["question ouverte sur le ressenti ou le processus","question sur un élément visuel précis"],"followUpExercise":"proposition courte pour prolonger l'exploration (texture, point de vue, détail…)"}`;
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

DONNÉES DE LA SÉANCE :
${contextBlock}

Réécrivez avec un accueil chaleureux : 3 ou 4 paragraphes (\\n\\n), vouvoiement, ancrés dans ce qui est RÉELLEMENT visible — pas d'invention. Symbolique au conditionnel uniquement. Si l'exercice n'a pas été suivi, accueillez la création montrée sans reproche.

FORMAT DE RÉPONSE ATTENDU :
{"reflection":"…","openQuestions":["…","…"],"followUpExercise":"…"}`;
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

function extractDevelopmentField(
  parsed: { development?: unknown } | null,
  normalized: string
): string | undefined {
  if (parsed && typeof parsed.development === "string") {
    const development = cleanAiText(parsed.development);
    if (development && !looksLikeJsonArtifact(development)) {
      return development;
    }
  }
  const extracted = extractJsonStringField(normalized, "development");
  if (!extracted) return undefined;
  const development = cleanAiText(extracted);
  if (development && !looksLikeJsonArtifact(development)) {
    return development;
  }
  return undefined;
}

export function parseExerciseFromAi(
  raw: string,
  preferredDuration?: number
): {
  exercise: string;
  durationMinutes: number;
  keywords: string[];
  development?: string;
} | null {
  const normalized = normalizeRawAiResponse(raw);
  const parsed = parseJsonFromText<{
    exercise?: unknown;
    development?: unknown;
    durationMinutes?: unknown;
    keywords?: unknown;
  }>(normalized);

  if (parsed && typeof parsed.exercise === "string") {
    const exercise = cleanAiText(parsed.exercise);
    if (exercise && !looksLikeJsonArtifact(exercise)) {
      const development = extractDevelopmentField(parsed, normalized);
      return {
        exercise,
        durationMinutes: clampDuration(parsed.durationMinutes, preferredDuration),
        keywords: sanitizeExerciseKeywords(parsed.keywords),
        ...(development ? { development } : {}),
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
      const keywordsMatch = normalized.match(
        /"keywords"\s*:\s*\[([\s\S]*?)\]/
      );
      let keywords: string[] = [];
      if (keywordsMatch?.[1]) {
        keywords = sanitizeExerciseKeywords(
          [...keywordsMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) =>
            m[1]!.replace(/\\"/g, '"')
          )
        );
      }
      const development = extractDevelopmentField(parsed, normalized);
      return {
        exercise,
        durationMinutes: clampDuration(durationRaw, preferredDuration),
        keywords,
        ...(development ? { development } : {}),
      };
    }
  }

  const prose = cleanAiText(normalized);
  if (prose.length >= 20 && !looksLikeJsonArtifact(prose)) {
    return {
      exercise: prose,
      durationMinutes: clampDuration(15, preferredDuration),
      keywords: [],
    };
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
