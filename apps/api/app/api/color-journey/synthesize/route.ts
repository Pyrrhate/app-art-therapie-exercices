import { z } from "zod";
import { synthesizeColorJourney } from "@/lib/ai/color-journey";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const choiceSchema = z.object({
  hex: z.string().min(4).max(7),
  label: z.string().min(1).max(48),
  dimensionId: z.string().min(1).max(32),
});

const bodySchema = z.object({
  history: z.array(choiceSchema).min(1).max(8),
  mood: z.string().max(120).optional(),
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
        { error: "Historique invalide.", code: "VALIDATION_ERROR" },
        400
      );
    }

    const result = await synthesizeColorJourney(parsed.data);
    return jsonResponse(result, request, {
      headers: { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    });
  } catch (error) {
    console.error("[color-journey/synthesize]", error);
    return errorResponse(
      request,
      { error: "Erreur interne.", code: "INTERNAL_ERROR" },
      500
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Utilisez POST avec { history, mood? }" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
