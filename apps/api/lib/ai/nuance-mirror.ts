export interface NuanceMirrorInput {
  colors: Array<{ hex: string; label: string }>;
  harmonyName?: string;
  discoveredElements?: string[];
  revealedCount: number;
  totalCells: number;
}

export interface NuanceMirrorResponse {
  mirror: string;
  source: "ai" | "fallback";
}

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

function buildFallbackMirror(input: NuanceMirrorInput): string {
  const names = input.colors.map((c) => c.label).slice(0, 5).join(", ");
  const harmony = input.harmonyName?.trim();
  const elements = input.discoveredElements?.join(", ");

  if (harmony && names) {
    return `« ${harmony} » réunit ${names} — laissez cette harmonie infuser votre geste, sans chercher à la « bien » traduire.`;
  }
  if (names) {
    return `Vos teintes (${names}) forment une carte intérieure — accueillez ce que ces nuances éveillent en vous, au conditionnel.`;
  }
  if (elements) {
    return `Les lotus ${elements} ouvrent un langage de matière et de rythme — explorez ce qui pulse sous la surface.`;
  }
  return "Votre grille révèle un paysage chromatique singulier — laissez ces nuances guider votre prochain geste.";
}

function buildPrompt(input: NuanceMirrorInput): string {
  const colorLines = input.colors
    .map((c) => `- ${c.label} (${c.hex})`)
    .join("\n");
  const elements = input.discoveredElements?.length
    ? `Lotus découverts : ${input.discoveredElements.join(", ")}.`
    : "";
  const harmony = input.harmonyName?.trim()
    ? `Nom donné à l'harmonie : « ${input.harmonyName.trim()} ».`
    : "";

  return `Tu es un miroir créatif bienveillant dans une app d'art-thérapie francophone.

Grille de nuances — ${input.revealedCount}/${input.totalCells} teintes révélées.
${harmony}
${elements}

Teintes dominantes :
${colorLines}

Rédige 2 à 3 phrases courtes (max 80 mots) qui :
- accueillent l'harmonie chromatique sans diagnostic psychologique
- évoquent symbolique et geste au conditionnel (« peut », « pourrait »)
- invitent doucement vers un exercice créatif

Vouvoiement. Pas de markdown. Pas de liste.`;
}

export async function generateNuanceMirror(
  input: NuanceMirrorInput
): Promise<NuanceMirrorResponse> {
  const token = process.env.HF_TOKEN?.trim();
  const fallback = buildFallbackMirror(input);

  if (!token || input.colors.length === 0) {
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
        max_tokens: 180,
        temperature: 0.75,
      }),
      signal: AbortSignal.timeout(35_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.warn("[nuances/mirror] HF error:", response.status);
      return { mirror: fallback, source: "fallback" };
    }

    const data = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content && content.length >= 20 && content.length <= 700) {
      return { mirror: content, source: "ai" };
    }

    return { mirror: fallback, source: "fallback" };
  } catch (error) {
    console.warn("[nuances/mirror]", error);
    return { mirror: fallback, source: "fallback" };
  }
}
