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
  logicalWord: string;
  suggestedWord: string;
  source: "ai" | "fallback";
}

function buildPingPongPrompt(word: string, history: string[]): string {
  const chain =
    history.length > 0
      ? `Chaîne déjà jouée : ${history.join(" → ")} → ${word}`
      : `Mot proposé : ${word}`;

  return `${chain}

Tu joues au ping-pong créatif en 5 étapes (humain / IA alternés).
Réponds avec EXACTEMENT deux mots français séparés par une barre verticale | :
1) mot logique — association proche et cohérente du mot humain
2) idée suggérée — mot poétique inspiré du mot logique ET du mot humain précédent

Format strict : mot1|mot2
Pas de phrase. Pas de guillemets. Max 24 caractères par mot.`;
}

function sanitizeSingleWord(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .replace(/[.!?,;:…]+$/g, "")
    .split(/\s+/)[0]
    ?.trim();

  if (!cleaned || cleaned.length > 32) return null;
  if (/[{}[\]<>/\\|]/.test(cleaned)) return null;
  return cleaned;
}

function pickUnused(pool: string[], used: Set<string>): string {
  const available = pool.filter((w) => !used.has(w.toLowerCase()));
  const pick = available.length > 0 ? available : FALLBACK_ASSOCIATIONS.default;
  return pick[Math.floor(Math.random() * pick.length)]!;
}

function fallbackReply(
  word: string,
  history: string[]
): { logicalWord: string; suggestedWord: string } {
  const key = word.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const pool =
    FALLBACK_ASSOCIATIONS[key] ??
    FALLBACK_ASSOCIATIONS[
      Object.keys(FALLBACK_ASSOCIATIONS).find((k) => key.includes(k)) ?? "default"
    ] ??
    FALLBACK_ASSOCIATIONS.default;

  const used = new Set([...history, word].map((w) => w.toLowerCase()));
  const logicalWord = pickUnused(pool, used);
  used.add(logicalWord.toLowerCase());

  const humanWords = history.filter((_, i) => i % 2 === 0);
  const previousHuman = humanWords[humanWords.length - 1] ?? word;
  const bridgeKey = `${logicalWord} ${previousHuman}`.toLowerCase();
  const bridgePool = [
    ...FALLBACK_ASSOCIATIONS.default,
    ...(FALLBACK_ASSOCIATIONS[previousHuman.toLowerCase()] ?? []),
    ...(FALLBACK_ASSOCIATIONS[logicalWord.toLowerCase()] ?? []),
    ...(FALLBACK_ASSOCIATIONS[
      Object.keys(FALLBACK_ASSOCIATIONS).find((k) => bridgeKey.includes(k)) ??
        "default"
    ] ?? []),
  ];
  const suggestedWord = pickUnused(bridgePool, used);

  return { logicalWord, suggestedWord };
}

function parseAiPair(raw: string): { logicalWord: string; suggestedWord: string } | null {
  const pipeParts = raw.split("|").map((p) => sanitizeSingleWord(p)).filter(Boolean);
  if (pipeParts.length >= 2) {
    return { logicalWord: pipeParts[0]!, suggestedWord: pipeParts[1]! };
  }
  const words = raw
    .split(/[\s,;]+/)
    .map((p) => sanitizeSingleWord(p))
    .filter(Boolean);
  if (words.length >= 2) {
    return { logicalWord: words[0]!, suggestedWord: words[1]! };
  }
  return null;
}

export async function generatePingPongWord(
  input: PingPongRequest
): Promise<PingPongResponse> {
  const word = input.word.trim();
  const history = input.history ?? [];
  const token = process.env.HF_TOKEN?.trim();

  if (!token) {
    const fb = fallbackReply(word, history);
    return { ...fb, source: "fallback" };
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
              "Tu réponds toujours par exactement deux mots français séparés par |. Format : mot_logique|idee_suggeree. Aucun autre texte.",
          },
          { role: "user", content: buildPingPongPrompt(word, history) },
        ],
        max_tokens: 24,
        temperature: 0.92,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn("[ping-pong] HF error:", response.status, rawBody.slice(0, 200));
      const fb = fallbackReply(word, history);
      return { ...fb, source: "fallback" };
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseAiPair(content);

    if (parsed) {
      return { ...parsed, source: "ai" };
    }

    const fb = fallbackReply(word, history);
    return { ...fb, source: "fallback" };
  } catch (error) {
    console.warn("[ping-pong]", error);
    const fb = fallbackReply(word, history);
    return { ...fb, source: "fallback" };
  }
}
