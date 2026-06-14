import { jsonResponse, handleOptions } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const hasToken = Boolean(process.env.HF_TOKEN?.trim());
  return jsonResponse(
    {
      status: "ok",
      provider: process.env.AI_PROVIDER ?? "huggingface",
      aiConfigured: hasToken,
      visionModel:
        process.env.HF_VISION_MODEL ??
        "Qwen/Qwen2.5-VL-7B-Instruct:fastest",
      timestamp: new Date().toISOString(),
    },
    request
  );
}
