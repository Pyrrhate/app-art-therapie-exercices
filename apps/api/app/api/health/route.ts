import { jsonResponse, handleOptions } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const hasToken = Boolean(process.env.HF_TOKEN?.trim());
  const textModel =
    process.env.HF_TEXT_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct";
  const visionModel =
    process.env.HF_VISION_MODEL ?? "zai-org/GLM-4.5V:novita";

  return jsonResponse(
    {
      status: "ok",
      provider: process.env.AI_PROVIDER ?? "huggingface",
      aiConfigured: hasToken,
      textModel,
      visionModel,
      reflectionPipeline: "warm-v2",
      aiHint: hasToken
        ? undefined
        : "Configurez HF_TOKEN sur Vercel pour activer l'IA (sinon mode secours).",
      timestamp: new Date().toISOString(),
    },
    request
  );
}
