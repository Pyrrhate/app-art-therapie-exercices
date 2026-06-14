import { z } from "zod";
import { generatePingPongWord } from "@/lib/ai/ping-pong";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const bodySchema = z.object({
  word: z.string().min(1).max(48),
  history: z.array(z.string().max(48)).max(12).optional(),
});

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    return errorResponse(
      request,
      {
        error: "Trop de requêtes. Réessayez dans un instant.",
        code: "RATE_LIMITED",
      },
      429
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      request,
      {
        error: "Corps JSON invalide. Envoyez { word, history? }.",
        code: "VALIDATION_ERROR",
      },
      400
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      request,
      { error: "Mot ou historique invalide.", code: "VALIDATION_ERROR" },
      400
    );
  }

  try {
    const result = await generatePingPongWord(parsed.data);
    return jsonResponse(result, request, {
      headers: { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    });
  } catch (error) {
    console.error("[ping-pong]", error);
    return errorResponse(
      request,
      { error: "Erreur interne.", code: "INTERNAL_ERROR" },
      500
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Utilisez POST avec { word, history? }" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
