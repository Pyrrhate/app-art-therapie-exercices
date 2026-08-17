/**
 * Affinage expérimental des prompts (potentiomètres).
 * Couche séparée des overrides texte : append uniquement si activé et non neutre.
 */

import type { PromptId } from "./ai-prompt-catalog";

/** Niveau de curseur : 0 = neutre (aucun effet). */
export type DialLevel = -2 | -1 | 0 | 1 | 2;

export const DIAL_LEVELS: DialLevel[] = [-2, -1, 0, 1, 2];

export interface PromptDialsValues {
  /** -2 précis / cadré → +2 ouvert / spacieux */
  openness: DialLevel;
  /** -2 peu de symbolisme → +2 symbolisme doux plus présent */
  symbolism: DialLevel;
  /** -2 plus court → +2 un peu plus développé */
  length: DialLevel;
  /** -2 plus métaphorique → +2 plus concret (matière / geste) */
  concreteness: DialLevel;
  /** -2 prudent → +2 audace créative douce */
  audacity: DialLevel;
}

/** Payload envoyé à l'API (jamais stocké serveur). */
export interface PromptDialsPayload {
  enabled: boolean;
  values: PromptDialsValues;
}

export const NEUTRAL_PROMPT_DIALS: PromptDialsValues = {
  openness: 0,
  symbolism: 0,
  length: 0,
  concreteness: 0,
  audacity: 0,
};

export const DEFAULT_PROMPT_DIALS_PAYLOAD: PromptDialsPayload = {
  enabled: false,
  values: { ...NEUTRAL_PROMPT_DIALS },
};

const DIAL_PROMPT_IDS: PromptId[] = [
  "exercise_system",
  "reflection_system",
  "creative_tips_system",
];

function clampDial(value: unknown): DialLevel {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const rounded = Math.round(n);
  if (rounded <= -2) return -2;
  if (rounded === -1) return -1;
  if (rounded === 0) return 0;
  if (rounded === 1) return 1;
  return 2;
}

export function sanitizePromptDials(input: unknown): PromptDialsPayload | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as Record<string, unknown>;
  const valuesRaw =
    raw.values && typeof raw.values === "object"
      ? (raw.values as Record<string, unknown>)
      : raw;
  return {
    enabled: Boolean(raw.enabled),
    values: {
      openness: clampDial(valuesRaw.openness),
      symbolism: clampDial(valuesRaw.symbolism),
      length: clampDial(valuesRaw.length),
      concreteness: clampDial(valuesRaw.concreteness),
      audacity: clampDial(valuesRaw.audacity),
    },
  };
}

export function hasActivePromptDials(
  dials?: PromptDialsPayload | null
): boolean {
  if (!dials?.enabled) return false;
  const v = dials.values;
  return (
    v.openness !== 0 ||
    v.symbolism !== 0 ||
    v.length !== 0 ||
    v.concreteness !== 0 ||
    v.audacity !== 0
  );
}

function lineForDial(
  key: keyof PromptDialsValues,
  level: DialLevel,
  language: "fr" | "en"
): string | null {
  if (level === 0) return null;
  const fr: Record<keyof PromptDialsValues, Record<Exclude<DialLevel, 0>, string>> = {
    openness: {
      [-2]: "Privilégiez un cadre plus précis et structuré dans la consigne.",
      [-1]: "Serrez un peu le cadre : consigne claire, peu d'ambiguïté.",
      [1]: "Laissez davantage d'espace et d'ouverture dans la consigne.",
      [2]: "Maximisez l'ouverture : invitation large, sans figer le geste.",
    },
    symbolism: {
      [-2]: "Restez très sobre sur le symbolisme ; restez proche du perceptible.",
      [-1]: "Symbolisme discret, au conditionnel, sans surcharge.",
      [1]: "Autorisez un peu plus d'évocations symboliques douces (toujours au conditionnel).",
      [2]: "Enrichissez les associations symboliques douces, toujours ouvertes et non cliniques.",
    },
    length: {
      [-2]: "Soyez plus concis que d'habitude (sans perdre la chaleur).",
      [-1]: "Raccourcissez légèrement le texte utilisateur.",
      [1]: "Développez un peu plus, sans devenir verbeux.",
      [2]: "Autorisez une réponse un peu plus ample, toujours dans les limites du format JSON.",
    },
    concreteness: {
      [-2]: "Inclinez vers la métaphore et l'association d'idées plutôt que le tutoriel.",
      [-1]: "Un peu plus d'image poétique que de consignes matérielles.",
      [1]: "Ancrez davantage dans la matière, le geste et le perceptible.",
      [2]: "Privilégiez le concret (matière, geste, rythme) plutôt que l'abstraction.",
    },
    audacity: {
      [-2]: "Restez prudent·e et rassurant·e ; peu de prises de risque créatives.",
      [-1]: "Audace créative très mesurée.",
      [1]: "Autorisez une pointe d'audace créative douce.",
      [2]: "Encouragez une exploration un peu plus audacieuse, sans brusquer.",
    },
  };
  const en: typeof fr = {
    openness: {
      [-2]: "Favour a more precise, structured brief.",
      [-1]: "Tighten the frame slightly: clear brief, little ambiguity.",
      [1]: "Leave more space and openness in the brief.",
      [2]: "Maximise openness: a wide invitation, without freezing the gesture.",
    },
    symbolism: {
      [-2]: "Stay very spare with symbolism; stay close to what is perceptible.",
      [-1]: "Discreet, conditional symbolism only.",
      [1]: "Allow a little more soft symbolic evocation (always conditional).",
      [2]: "Enrich soft symbolic associations, always open and non-clinical.",
    },
    length: {
      [-2]: "Be more concise than usual (without losing warmth).",
      [-1]: "Shorten the user-facing text slightly.",
      [1]: "Develop a little more, without becoming wordy.",
      [2]: "Allow a somewhat fuller reply, still within the JSON format limits.",
    },
    concreteness: {
      [-2]: "Lean toward metaphor and association rather than tutorial steps.",
      [-1]: "A little more poetic image than material instruction.",
      [1]: "Anchor more in material, gesture and the perceptible.",
      [2]: "Favour the concrete (material, gesture, rhythm) over abstraction.",
    },
    audacity: {
      [-2]: "Stay cautious and reassuring; little creative risk-taking.",
      [-1]: "Very measured creative boldness.",
      [1]: "Allow a touch of gentle creative boldness.",
      [2]: "Encourage a slightly bolder exploration, without rushing the person.",
    },
  };
  const table = language === "en" ? en : fr;
  return table[key][level as Exclude<DialLevel, 0>] ?? null;
}

/**
 * Bloc à ajouter après le prompt système (défaut ou override texte).
 * Chaîne vide si inactif / hors scope / tout au centre.
 */
export function buildPromptDialsAppend(
  promptId: PromptId,
  dials?: PromptDialsPayload | null,
  language: "fr" | "en" = "fr"
): string {
  if (!hasActivePromptDials(dials)) return "";
  if (!DIAL_PROMPT_IDS.includes(promptId)) return "";

  const v = dials!.values;
  const keys: (keyof PromptDialsValues)[] =
    promptId === "exercise_system"
      ? ["openness", "length", "concreteness", "audacity"]
      : promptId === "reflection_system"
        ? ["symbolism", "length", "openness", "audacity"]
        : ["symbolism", "concreteness", "length", "audacity"];

  const lines: string[] = [];
  for (const key of keys) {
    const line = lineForDial(key, v[key], language);
    if (line) lines.push(`- ${line}`);
  }
  if (lines.length === 0) return "";

  if (language === "en") {
    return `EXPERIMENTAL FINE-TUNING (user dials — soft preferences only; never override safety, clinical limits, or JSON format):
${lines.join("\n")}`;
  }

  return `AFFINAGE EXPÉRIMENTAL (curseurs utilisateur — préférences douces uniquement ; ne jamais outrepasser la sécurité, les limites non cliniques, ni le format JSON) :
${lines.join("\n")}`;
}

/** Applique l'append dials après un prompt système déjà résolu. */
export function applyPromptDialsAppend(
  systemPrompt: string,
  promptId: PromptId,
  dials?: PromptDialsPayload | null,
  language: "fr" | "en" = "fr"
): string {
  const append = buildPromptDialsAppend(promptId, dials, language);
  if (!append) return systemPrompt;
  return `${systemPrompt.trim()}\n\n${append}`;
}
