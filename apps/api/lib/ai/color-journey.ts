import {
  COLOR_JOURNEY_DIMENSIONS,
  COLOR_JOURNEY_TURN_COUNT,
  getDimensionForTurn,
} from "./color-journey-dimensions";

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

export interface ColorProposal {
  hex: string;
  label: string;
  hint: string;
}

export interface ColorChoice {
  hex: string;
  label: string;
  dimensionId: string;
}

export interface ColorJourneyStartRequest {
  mood?: string;
  seedWord?: string;
}

export interface ColorJourneyStartResponse {
  intro: string;
  turn: number;
  dimension: (typeof COLOR_JOURNEY_DIMENSIONS)[number];
  proposals: ColorProposal[];
  contextNote?: string;
  source: "ai" | "fallback";
}

export interface ColorJourneyChooseRequest {
  turn: number;
  chosen: ColorProposal;
  history: ColorChoice[];
  mood?: string;
  seedWord?: string;
}

export interface ColorJourneyChooseResponse {
  reflection: string;
  psychology: string;
  theory: string;
  question?: string;
  source: "ai" | "fallback";
  nextTurn?: number;
  nextDimension?: (typeof COLOR_JOURNEY_DIMENSIONS)[number];
  proposals?: ColorProposal[];
  contextNote?: string;
}

export interface ColorJourneySynthesizeRequest {
  history: ColorChoice[];
  mood?: string;
}

export interface ColorJourneySynthesizeResponse {
  summary: string;
  suggestedImpulse: string;
  palette: ColorChoice[];
  source: "ai" | "fallback";
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (HEX_RE.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return null;
}

function extractJsonObject(raw: string): unknown | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function sanitizeProposal(raw: unknown): ColorProposal | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const hex = normalizeHex(String(item.hex ?? ""));
  const label = String(item.label ?? "").trim().slice(0, 48);
  const hint = String(item.hint ?? "").trim().slice(0, 120);
  if (!hex || !label) return null;
  return { hex, label, hint: hint || "Une teinte à explorer en douceur." };
}

function parseProposals(raw: unknown): ColorProposal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(sanitizeProposal)
    .filter((p): p is ColorProposal => p !== null)
    .slice(0, 3);
}

const FALLBACK_PROPOSALS: Record<string, ColorProposal[]> = {
  anchor: [
    { hex: "#527058", label: "Forêt profonde", hint: "Stabilité et racines" },
    { hex: "#A8856A", label: "Terre chaude", hint: "Solidité apaisante" },
    { hex: "#6B8F71", label: "Sauge ancrée", hint: "Présence calme" },
  ],
  energy: [
    { hex: "#E8A84A", label: "Ambre doux", hint: "Chaleur contenue" },
    { hex: "#C45C4A", label: "Corail feu", hint: "Élan créatif" },
    { hex: "#FFD700", label: "Or pâle", hint: "Lumière intérieure" },
  ],
  softness: [
    { hex: "#D4C4B5", label: "Brume rosée", hint: "Enveloppement" },
    { hex: "#E8DDD4", label: "Sable tendre", hint: "Douceur tactile" },
    { hex: "#8FA88A", label: "Sauge claire", hint: "Respiration" },
  ],
  clarity: [
    { hex: "#FAF7F4", label: "Crème lumineuse", hint: "Espace ouvert" },
    { hex: "#FFFFFF", label: "Perle", hint: "Transparence" },
    { hex: "#00CED1", label: "Cyan clair", hint: "Fraîcheur mentale" },
  ],
  depth: [
    { hex: "#4A5568", label: "Bleu nuit", hint: "Intériorité" },
    { hex: "#527058", label: "Vert profond", hint: "Mystère végétal" },
    { hex: "#6B5B95", label: "Violet brume", hint: "Rêverie" },
  ],
  joy: [
    { hex: "#FFD700", label: "Soleil pâle", hint: "Éclat léger" },
    { hex: "#FF1493", label: "Fuchsia doux", hint: "Joie vibrante" },
    { hex: "#E8A84A", label: "Miel", hint: "Douceur ensoleillée" },
  ],
  mystery: [
    { hex: "#6B5B95", label: "Améthyste", hint: "Intuition" },
    { hex: "#4A5568", label: "Crépuscule", hint: "Seuil" },
    { hex: "#527058", label: "Mousse", hint: "Secret vivant" },
  ],
  harmony: [
    { hex: "#6B8F71", label: "Sauge harmonie", hint: "Équilibre" },
    { hex: "#D4C4B5", label: "Brume unie", hint: "Accord des teintes" },
    { hex: "#A8856A", label: "Terre et ciel", hint: "Synthèse chaleureuse" },
  ],
};

function fallbackProposals(turn: number): ColorProposal[] {
  const dim = getDimensionForTurn(turn);
  return [...(FALLBACK_PROPOSALS[dim.id] ?? FALLBACK_PROPOSALS.anchor)];
}

function fallbackStart(input: ColorJourneyStartRequest): ColorJourneyStartResponse {
  const dim = getDimensionForTurn(1);
  const mood = input.mood?.trim() || input.seedWord?.trim();
  return {
    intro: mood
      ? `Accueillons votre mot « ${mood.slice(0, 40)} » — huit teintes vont dialoguer avec vous, sans jugement.`
      : "Huit invitations chromatiques vous attendent. Choisissez à votre rythme, sans bonne ni mauvaise réponse.",
    turn: 1,
    dimension: dim,
    proposals: fallbackProposals(1),
    contextNote: `${dim.title} — ${dim.subtitle}`,
    source: "fallback",
  };
}

function fallbackChoose(
  input: ColorJourneyChooseRequest
): ColorJourneyChooseResponse {
  const dim = getDimensionForTurn(input.turn);
  const nextTurn = input.turn + 1;
  const response: ColorJourneyChooseResponse = {
    reflection: `${input.chosen.label} accueille une part de vous — laissez cette teinte résonner sans chercher à la fixer.`,
    psychology: `En psychologie des couleurs, des teintes proches de ${input.chosen.label.toLowerCase()} sont souvent associées à un besoin de ${dim.subtitle.toLowerCase()}.`,
    theory: `Sur le cercle chromatique, cette nuance dialogue avec vos choix précédents par proximité ou contraste doux.`,
    question: "Où sentez-vous cette couleur dans votre corps, en ce moment ?",
    source: "fallback",
  };

  if (nextTurn <= COLOR_JOURNEY_TURN_COUNT) {
    response.nextTurn = nextTurn;
    response.nextDimension = getDimensionForTurn(nextTurn);
    response.proposals = fallbackProposals(nextTurn);
    response.contextNote = `${response.nextDimension.title} — ${response.nextDimension.subtitle}`;
  }

  return response;
}

function fallbackSynthesize(
  input: ColorJourneySynthesizeRequest
): ColorJourneySynthesizeResponse {
  const labels = input.history.map((h) => h.label).join(", ");
  return {
    summary: `Votre palette intérieure tisse ${input.history.length} teintes — ${labels}. Elle raconte un cheminement unique, à accueillir tel quel.`,
    suggestedImpulse: `Palette intérieure : ${labels}`,
    palette: input.history,
    source: "fallback",
  };
}

function formatHistory(history: ColorChoice[]): string {
  if (history.length === 0) return "Aucun choix précédent.";
  return history
    .map(
      (h, i) =>
        `${i + 1}. ${h.label} (${h.hex}) — dimension ${h.dimensionId}`
    )
    .join("\n");
}

function buildStartPrompt(input: ColorJourneyStartRequest): string {
  const dim = getDimensionForTurn(1);
  const mood = input.mood?.trim() || input.seedWord?.trim() || "non précisé";
  return `Tu es un·e guide art-thérapeutique francophone. Vouvoiement, ton chaleureux, jamais diagnostic.

Contexte utilisateur·rice : « ${mood.slice(0, 120)} »

Tour 1 / ${COLOR_JOURNEY_TURN_COUNT} — Dimension « ${dim.title} » (${dim.subtitle}).

Propose exactement 3 couleurs (hex #RRGGBB réalistes, labels poétiques courts, hint 1 phrase).
Théorie des couleurs + psychologie des couleurs (associations culturelles larges, pas de diagnostic).
Les 3 teintes doivent être distinctes et adaptées au contexte.

JSON uniquement :
{"intro":"2 phrases d'accueil","proposals":[{"hex":"#...","label":"...","hint":"..."}],"contextNote":"1 phrase pour ce tour"}`;
}

function buildChoosePrompt(input: ColorJourneyChooseRequest): string {
  const dim = getDimensionForTurn(input.turn);
  const nextTurn = input.turn + 1;
  const hasNext = nextTurn <= COLOR_JOURNEY_TURN_COUNT;
  const nextDim = hasNext ? getDimensionForTurn(nextTurn) : null;
  const mood = input.mood?.trim() || input.seedWord?.trim() || "non précisé";

  return `Tu es un·e guide art-thérapeutique francophone. Vouvoiement, ton chaleureux, jamais diagnostic.

Contexte : « ${mood.slice(0, 120)} »
Choix précédents :
${formatHistory(input.history)}

Tour ${input.turn} — l'utilisateur·rice a choisi : ${input.chosen.label} (${input.chosen.hex}) pour « ${dim.title} ».

Rédigez :
- reflection : 2-3 phrases d'accueil de cette teinte
- psychology : 1 phrase (associations larges, « souvent liée à… »)
- theory : 1 phrase (complémentaire/analogue/température/contraste avec choix précédents)
- question : 1 question ouverte optionnelle

${
  hasNext
    ? `Puis proposez le tour ${nextTurn} — « ${nextDim!.title} » (${nextDim!.subtitle}) : exactement 3 nouvelles proposals + contextNote.

JSON :
{"reflection":"...","psychology":"...","theory":"...","question":"...","proposals":[{"hex":"#...","label":"...","hint":"..."}],"contextNote":"..."}`
    : `Dernier tour — pas de proposals.

JSON :
{"reflection":"...","psychology":"...","theory":"...","question":"..."}`
}`;
}

function buildSynthesizePrompt(input: ColorJourneySynthesizeRequest): string {
  const mood = input.mood?.trim() || "non précisé";
  return `Tu es un·e guide art-thérapeutique francophone. Vouvoiement, ton chaleureux.

Contexte initial : « ${mood.slice(0, 120)} »
Palette complète (8 teintes choisies) :
${formatHistory(input.history)}

Synthétisez ce parcours chromatique :
- summary : 3-4 phrases, accueil du cheminement global
- suggestedImpulse : une phrase courte pour un exercice créatif (peinture/mixed media)

JSON uniquement :
{"summary":"...","suggestedImpulse":"..."}`;
}

async function callColorJourneyModel(prompt: string): Promise<string | null> {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) return null;

  const textModel =
    process.env.HF_TEXT_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct";

  try {
    const response = await fetch(HF_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [
          {
            role: "system",
            content:
              "Tu réponds uniquement en JSON valide, sans markdown. Français, vouvoiement, art-thérapie bienveillante.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.78,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn("[color-journey] HF error:", response.status, rawBody.slice(0, 200));
      return null;
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.warn("[color-journey]", error);
    return null;
  }
}

export async function startColorJourney(
  input: ColorJourneyStartRequest
): Promise<ColorJourneyStartResponse> {
  const dim = getDimensionForTurn(1);
  const raw = await callColorJourneyModel(buildStartPrompt(input));
  if (!raw) return fallbackStart(input);

  const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
  const proposals = parseProposals(parsed?.proposals);
  if (proposals.length < 2) return fallbackStart(input);

  return {
    intro: String(parsed?.intro ?? "").trim().slice(0, 400) ||
      fallbackStart(input).intro,
    turn: 1,
    dimension: dim,
    proposals,
    contextNote: String(parsed?.contextNote ?? `${dim.title} — ${dim.subtitle}`).slice(0, 200),
    source: "ai",
  };
}

export async function chooseColorJourney(
  input: ColorJourneyChooseRequest
): Promise<ColorJourneyChooseResponse> {
  const raw = await callColorJourneyModel(buildChoosePrompt(input));
  if (!raw) return fallbackChoose(input);

  const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
  if (!parsed) return fallbackChoose(input);

  const reflection = String(parsed.reflection ?? "").trim();
  const psychology = String(parsed.psychology ?? "").trim();
  const theory = String(parsed.theory ?? "").trim();
  if (!reflection || !psychology) return fallbackChoose(input);

  const nextTurn = input.turn + 1;
  const response: ColorJourneyChooseResponse = {
    reflection: reflection.slice(0, 500),
    psychology: psychology.slice(0, 280),
    theory: (theory || "Cette teinte dialogue avec votre parcours.").slice(0, 280),
    question: String(parsed.question ?? "").trim().slice(0, 160) || undefined,
    source: "ai",
  };

  if (nextTurn <= COLOR_JOURNEY_TURN_COUNT) {
    const proposals = parseProposals(parsed.proposals);
    if (proposals.length >= 2) {
      response.nextTurn = nextTurn;
      response.nextDimension = getDimensionForTurn(nextTurn);
      response.proposals = proposals;
      response.contextNote = String(parsed.contextNote ?? "").slice(0, 200);
    } else {
      const fb = fallbackChoose(input);
      return {
        ...fb,
        reflection: response.reflection,
        psychology: response.psychology,
        theory: response.theory,
        question: response.question,
        source: "ai",
      };
    }
  }

  return response;
}

export async function synthesizeColorJourney(
  input: ColorJourneySynthesizeRequest
): Promise<ColorJourneySynthesizeResponse> {
  if (input.history.length === 0) {
    return fallbackSynthesize(input);
  }

  const raw = await callColorJourneyModel(buildSynthesizePrompt(input));
  if (!raw) return fallbackSynthesize(input);

  const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
  const summary = String(parsed?.summary ?? "").trim();
  const suggestedImpulse = String(parsed?.suggestedImpulse ?? "").trim();
  if (!summary) return fallbackSynthesize(input);

  return {
    summary: summary.slice(0, 800),
    suggestedImpulse: suggestedImpulse.slice(0, 200) ||
      fallbackSynthesize(input).suggestedImpulse,
    palette: input.history,
    source: "ai",
  };
}
