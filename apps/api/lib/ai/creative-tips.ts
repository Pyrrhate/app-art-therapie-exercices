/**
 * Pistes créatives opt-in — associations / symbolisme doux / gestes en ouverture.
 * Distinct du champ `development` (déroulé de la consigne).
 */

import {
  resolvePromptText,
  type PromptOverrides,
} from "@art-therapie/shared";
import { techniqueLabelForLanguage } from "../techniques";
import type {
  CreativeTipsRequest,
  CreativeTipsResponse,
} from "../types";
import {
  cleanAiText,
  looksLikeJsonArtifact,
  normalizePromptLanguage,
  parseJsonFromText,
  type PromptLanguage,
} from "./prompts";

export function resolveCreativeTipsSystemPrompt(
  overrides?: PromptOverrides | null,
  language: PromptLanguage = "fr"
): string {
  const base = resolvePromptText("creative_tips_system", overrides);
  if (language === "en") {
    return `${base}

OUTPUT LANGUAGE (mandatory):
- Write every tip in natural English.
- Warm second-person address (“you”).
- Do not answer in French unless quoting the impulse briefly.`;
  }
  return `${base}

LANGUE DE SORTIE (obligatoire) :
- Rédigez toutes les pistes en français.
- Vouvoiement doux (« vous »).`;
}

export function buildCreativeTipsPrompt(
  input: CreativeTipsRequest,
  language: PromptLanguage = "fr"
): string {
  const label = techniqueLabelForLanguage(input.technique, language);
  const impulse = input.impulse.trim();
  const exercise = input.exercise.trim().slice(0, 1200);
  const development = input.development?.trim().slice(0, 600);

  if (language === "en") {
    return `CONTEXT (already shown to the person — do NOT rewrite a new brief):
- Impulse: “${impulse}”
- Technique: ${label}
- Brief:
« ${exercise} »
${development ? `- Development already provided (do not repeat it):\n« ${development} »\n` : ""}
Respond ONLY with valid JSON:
{"tips":["tip 1","tip 2","tip 3"]}

Write 3 to 5 short tips in English.`;
  }

  return `CONTEXTE (déjà affiché à la personne — NE PAS réécrire une consigne) :
- Impulsion : « ${impulse} »
- Technique : ${label}
- Consigne :
« ${exercise} »
${development ? `- Développement déjà fourni (ne pas le répéter) :\n« ${development} »\n` : ""}
Répondez UNIQUEMENT en JSON valide :
{"tips":["piste 1","piste 2","piste 3"]}

Rédigez 3 à 5 pistes courtes en français.`;
}

export function getFallbackCreativeTips(
  input: CreativeTipsRequest
): CreativeTipsResponse {
  const language = normalizePromptLanguage(input.language);
  const impulse =
    input.impulse.trim() ||
    (language === "en" ? "your impulse" : "votre impulsion");
  const label = techniqueLabelForLanguage(input.technique, language);

  if (language === "en") {
    return {
      tips: [
        `Let “${impulse}” open free associations — colours, textures, rhythms — without hunting for the “right” image.`,
        `If a symbol appears in your ${label}, hold it conditionally: it might evoke… rather than locking one meaning.`,
        `Vary one gesture or material quality (pressure, speed, scale) to extend the exploration without rewriting the brief.`,
      ],
      source: "fallback",
    };
  }

  return {
    tips: [
      `Laissez « ${impulse} » ouvrir des associations libres — couleurs, textures, rythmes — sans chercher la « bonne » image.`,
      `Si un symbole apparaît dans votre ${label}, accueillez-le au conditionnel : il pourrait évoquer… plutôt qu'imposer un sens fixe.`,
      `Variez un geste ou une qualité de matière (pression, vitesse, échelle) pour prolonger l'exploration sans refaire la consigne.`,
    ],
    source: "fallback",
  };
}

export function parseCreativeTipsFromAi(raw: string): string[] | null {
  const parsed = parseJsonFromText<{ tips?: unknown }>(raw);
  const tips: string[] = [];

  if (parsed && Array.isArray(parsed.tips)) {
    for (const item of parsed.tips) {
      if (typeof item !== "string") continue;
      const cleaned = cleanAiText(item);
      if (
        cleaned &&
        cleaned.length >= 12 &&
        cleaned.length <= 280 &&
        !looksLikeJsonArtifact(cleaned)
      ) {
        tips.push(cleaned);
      }
    }
  }

  if (tips.length >= 2) {
    return tips.slice(0, 5);
  }

  // Secours : puces markdown / lignes numérotées
  const lines = raw
    .split(/\r?\n/)
    .map((line) =>
      cleanAiText(line.replace(/^\s*([•\-*]|\d+[.)])\s*/, ""))
    )
    .filter(
      (line) =>
        line.length >= 12 &&
        line.length <= 280 &&
        !looksLikeJsonArtifact(line) &&
        !/^tips\b/i.test(line)
    );

  if (lines.length >= 2) {
    return lines.slice(0, 5);
  }

  return null;
}

/**
 * Exécute la génération via un callback texte (chaque provider branche son callText / chat).
 */
export async function runCreativeTipsGeneration(
  input: CreativeTipsRequest,
  callText: (userPrompt: string, systemPrompt: string) => Promise<string>
): Promise<CreativeTipsResponse> {
  const language = normalizePromptLanguage(input.language);
  const system = resolveCreativeTipsSystemPrompt(
    input.promptOverrides,
    language
  );
  const user = buildCreativeTipsPrompt(input, language);
  const raw = await callText(user, system);
  const tips = parseCreativeTipsFromAi(raw);

  if (!tips) {
    return {
      ...getFallbackCreativeTips(input),
      fallbackNote: "Format de pistes non exploitable.",
    };
  }

  return { tips, source: "ai" };
}
