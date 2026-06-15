import { z } from "zod";
import { startColorJourney } from "@/lib/ai/color-journey";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const bodySchema = z.object({
  mood: z.string().max(120).optional(),
  seedWord: z.string().max(48).optional(),
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

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        request,
        { error: "Contexte invalide.", code: "VALIDATION_ERROR" },
        400
      );
    }

    const result = await startColorJourney(parsed.data);
    return jsonResponse(result, request, {
      headers: { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    });
  } catch (error) {
    console.error("[color-journey/start]", error);
    return errorResponse(
      request,
      { error: "Erreur interne.", code: "INTERNAL_ERROR" },
      500
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Utilisez POST avec { mood?, seedWord? }" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
