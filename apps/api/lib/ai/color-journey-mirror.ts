export interface ColorMirrorInput {
  mode: "turn" | "synthesis";
  turn?: number;
  chosen?: { hex: string; label: string; dimensionId: string };
  history: Array<{ hex: string; label: string; dimensionId: string }>;
}

export interface ColorMirrorResponse {
  mirror: string;
  source: "ai" | "fallback";
}

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

const DIMENSION_LABELS: Record<string, string> = {
  anchor: "Ancrage",
  complement: "Complémentaire",
  closure: "Équilibre",
};

function buildFallbackMirror(input: ColorMirrorInput): string {
  const labels = input.history.map((h) => h.label).join(", ");

  if (input.mode === "synthesis") {
    return labels
      ? `Votre trio chromatique (${labels}) forme un langage intérieur singulier — laissez ces teintes guider votre geste sans chercher le « beau » résultat.`
      : "Votre palette est prête à devenir geste — accueillez ce qui émerge sans viser la perfection.";
  }

  const chosen = input.chosen?.label ?? "cette teinte";
  const dim = DIMENSION_LABELS[input.chosen?.dimensionId ?? ""] ?? "ce tour";
  return `${chosen} rejoint votre parcours (${dim}) — observez ce que cette couleur éveille en vous, sans l'interpréter comme une étiquette.`;
}

function buildPrompt(input: ColorMirrorInput): string {
  const historyLines = input.history
    .map((h, i) => {
      const dim = DIMENSION_LABELS[h.dimensionId] ?? h.dimensionId;
      return `Tour ${i + 1} (${dim}) : ${h.label} (${h.hex})`;
    })
    .join("\n");

  if (input.mode === "synthesis") {
    return `Tu es un miroir créatif bienveillant dans une app d'art-thérapie francophone.

Palette choisie :
${historyLines}

Rédige 2 à 3 phrases courtes (max 70 mots) qui :
- accueillent la palette sans diagnostic psychologique
- évoquent symbolique et geste au conditionnel (« peut », « pourrait »)
- invitent doucement vers un exercice créatif

Vouvoiement. Pas de markdown. Pas de liste.`;
  }

  const chosen = input.chosen!;
  const dim = DIMENSION_LABELS[chosen.dimensionId] ?? chosen.dimensionId;

  return `Tu es un miroir créatif bienveillant dans une app d'art-thérapie francophone.

Historique :
${historyLines}

Dernier choix (tour ${input.turn ?? "?"}, ${dim}) : ${chosen.label} (${chosen.hex})

Rédige 2 phrases courtes (max 45 mots) qui accueillent ce choix sans interpréter cliniquement. Symbolique au conditionnel. Vouvoiement. Pas de markdown.`;
}

export async function generateColorJourneyMirror(
  input: ColorMirrorInput
): Promise<ColorMirrorResponse> {
  const token = process.env.HF_TOKEN?.trim();
  const fallback = buildFallbackMirror(input);

  if (!token || input.history.length === 0) {
    return { mirror: fallback, source: "fallback" };
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
              "Tu rédiges des miroirs créatifs courts en français. Ton chaleureux, jamais clinique. Au conditionnel pour la symbolique.",
          },
          { role: "user", content: buildPrompt(input) },
        ],
        max_tokens: 160,
        temperature: 0.75,
      }),
      signal: AbortSignal.timeout(35_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn("[color-journey/mirror] HF error:", response.status);
      return { mirror: fallback, source: "fallback" };
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content && content.length >= 20 && content.length <= 600) {
      return { mirror: content, source: "ai" };
    }

    return { mirror: fallback, source: "fallback" };
  } catch (error) {
    console.warn("[color-journey/mirror]", error);
    return { mirror: fallback, source: "fallback" };
  }
}
