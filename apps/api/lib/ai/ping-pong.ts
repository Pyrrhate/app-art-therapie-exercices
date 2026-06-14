const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

const FALLBACK_ASSOCIATIONS: Record<string, string[]> = {
  arbre: ["racine", "ombre", "feuille", "sève", "ciel"],
  mer: ["vague", "sel", "horizon", "profondeur", "écume"],
  feu: ["cendre", "chaleur", "étincelle", "lumière", "braise"],
  default: ["silence", "souffle", "trace", "mouvement", "écho", "lumière"],
};

export interface PingPongRequest {
  word: string;
  history?: string[];
}

export interface PingPongResponse {
  word: string;
  source: "ai" | "fallback";
}

function buildPingPongPrompt(word: string, history: string[]): string {
  const chain =
    history.length > 0
      ? `Chaîne déjà jouée : ${history.join(" → ")} → ${word}`
      : `Mot proposé : ${word}`;

  return `${chain}

Tu joues au ping-pong créatif : association libre d'idées, en français.
Réponds avec UN SEUL mot — associé latéralement (pas synonyme direct, pas explication).
Pas de phrase. Pas de ponctuation. Pas de guillemets. Un seul mot, max 24 caractères.`;
}

function sanitizeSingleWord(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .replace(/[.!?,;:…]+$/g, "")
    .split(/\s+/)[0]
    ?.trim();

  if (!cleaned || cleaned.length > 32) return null;
  if (/[{}[\]<>/\\]/.test(cleaned)) return null;
  return cleaned;
}

function fallbackWord(word: string, history: string[]): string {
  const key = word.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const pool =
    FALLBACK_ASSOCIATIONS[key] ??
    FALLBACK_ASSOCIATIONS[
      Object.keys(FALLBACK_ASSOCIATIONS).find((k) => key.includes(k)) ?? "default"
    ] ??
    FALLBACK_ASSOCIATIONS.default;

  const used = new Set([...history, word].map((w) => w.toLowerCase()));
  const available = pool.filter((w) => !used.has(w.toLowerCase()));
  const pick = available.length > 0 ? available : FALLBACK_ASSOCIATIONS.default;
  return pick[Math.floor(Math.random() * pick.length)]!;
}

export async function generatePingPongWord(
  input: PingPongRequest
): Promise<PingPongResponse> {
  const word = input.word.trim();
  const history = input.history ?? [];
  const token = process.env.HF_TOKEN?.trim();

  if (!token) {
    return { word: fallbackWord(word, history), source: "fallback" };
  }

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
              "Tu réponds toujours par exactement UN mot français. Association créative latérale. Aucun autre texte.",
          },
          { role: "user", content: buildPingPongPrompt(word, history) },
        ],
        max_tokens: 16,
        temperature: 0.95,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn("[ping-pong] HF error:", response.status, rawBody.slice(0, 200));
      return { word: fallbackWord(word, history), source: "fallback" };
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = sanitizeSingleWord(content);

    if (parsed) {
      return { word: parsed, source: "ai" };
    }

    return { word: fallbackWord(word, history), source: "fallback" };
  } catch (error) {
    console.warn("[ping-pong]", error);
    return { word: fallbackWord(word, history), source: "fallback" };
  }
}
