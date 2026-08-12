export interface ColorMirrorInput {
  mode: "turn" | "synthesis";
  turn?: number;
  chosen?: {
    hex: string;
    label: string;
    dimensionId: string;
    mixRecipe?: string;
  };
  history: Array<{
    hex: string;
    label: string;
    dimensionId: string;
    mixRecipe?: string;
  }>;
}

export interface ColorMirrorResponse {
  mirror: string;
  source: "ai" | "fallback";
}

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

const DIMENSION_LABELS: Record<string, string> = {
  primary: "Primaire",
  secondary: "Secondaire",
  tertiary: "Tertiaire",
  anchor: "Primaire",
  complement: "Secondaire",
  closure: "Tertiaire",
};

function buildFallbackMirror(input: ColorMirrorInput): string {
  const labels = input.history.map((h) => h.label).join(", ");

  if (input.mode === "synthesis") {
    return labels
      ? `Votre palette peinture (${labels}) est prête — primaire pour les masses, secondaire pour l'équilibre, tertiaire pour les accents.`
      : "Votre palette est prête — testez chaque teinte sur une bande d'essai avant de peindre.";
  }

  const chosen = input.chosen?.label ?? "cette teinte";
  const dim = DIMENSION_LABELS[input.chosen?.dimensionId ?? ""] ?? "cette étape";
  return `${chosen} (${dim}) rejoint votre palette — pensez au ratio 60·30·10 selon le rôle de chaque teinte.`;
}

function buildPrompt(input: ColorMirrorInput): string {
  const historyLines = input.history
    .map((h) => {
      const dim = DIMENSION_LABELS[h.dimensionId] ?? h.dimensionId;
      const recipe = h.mixRecipe ? ` · ${h.mixRecipe}` : "";
      return `${dim} : ${h.label} (${h.hex})${recipe}`;
    })
    .join("\n");

  if (input.mode === "synthesis") {
    return `Tu es un assistant palette peinture dans une app d'exercices créatifs francophone (théorie RYB).

Palette construite :
${historyLines}

Rédige 2 à 3 phrases courtes (max 75 mots) qui :
- expliquent comment utiliser chaque teinte (masses, équilibre, accents)
- rappellent le ratio 60 % primaire · 30 % secondaire · 10 % tertiaire
- invitent vers un exercice de peinture ou dessin couleur

Ton pratique et encourageant. Vouvoiement. Pas de markdown. Pas de liste.`;
  }

  const chosen = input.chosen!;
  const dim = DIMENSION_LABELS[chosen.dimensionId] ?? chosen.dimensionId;
  const recipe = chosen.mixRecipe ? `\nRecette : ${chosen.mixRecipe}` : "";

  return `Tu es un assistant palette peinture dans une app d'exercices créatifs francophone.

Palette en cours :
${historyLines}

Dernier choix (${dim}) : ${chosen.label} (${chosen.hex})${recipe}

Rédige 2 phrases courtes (max 50 mots) avec un conseil pratique de peinture (mélange, proportion, geste). Vouvoiement. Pas de markdown.`;
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
              "Tu rédiges des conseils courts sur la palette peinture en français. Pratique, jamais clinique. Théorie RYB.",
          },
          { role: "user", content: buildPrompt(input) },
        ],
        max_tokens: 180,
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
