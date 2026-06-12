import { z } from "zod";
import { getAIProvider } from "@/lib/ai";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const bodySchema = z.object({
  impulse: z.string().min(1).max(200),
  technique: z.enum([
    "drawing",
    "painting",
    "writing",
    "mixed_media",
    "recyclart",
  ]),
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
      { error: "Trop de requêtes. Réessayez dans un instant.", code: "RATE_LIMITED" },
      429
    );
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        request,
        { error: "Données invalides.", code: "VALIDATION_ERROR" },
        400
      );
    }

    const provider = getAIProvider();
    const result = await provider.generateExercise(parsed.data);

    return jsonResponse(result, request, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch {
    return errorResponse(
      request,
      { error: "Erreur interne.", code: "INTERNAL_ERROR" },
      500
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Utilisez POST avec { impulse, technique }" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
