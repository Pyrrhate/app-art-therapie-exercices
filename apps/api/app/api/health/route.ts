import { jsonResponse, handleOptions } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  return jsonResponse(
    {
      status: "ok",
      provider: process.env.AI_PROVIDER ?? "huggingface",
      timestamp: new Date().toISOString(),
    },
    request
  );
}
