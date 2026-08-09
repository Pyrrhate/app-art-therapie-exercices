import { z } from "zod";
import { withFreemiumAI } from "@/lib/ai/with-freemium";
import { byokBodySchema } from "@/lib/ai/byok";
import { promptOverridesSchema } from "@/lib/ai/prompt-overrides";
import { artisticTechniqueSchema } from "@/lib/techniques";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const bodySchema = z.object({
  impulse: z.string().min(1).max(200),
  technique: artisticTechniqueSchema,
  durationMinutes: z.union([z.literal(15), z.literal(30), z.literal(45)]).optional(),
  augmentationContext: z.string().min(20).max(8000).optional(),
  promptOverrides: promptOverridesSchema,
  byok: byokBodySchema,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      request,
      {
        error:
          "Corps JSON invalide ou absent. Envoyez { impulse, technique }.",
        code: "VALIDATION_ERROR",
      },
      400
    );
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      request,
      { error: "Données invalides.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const { byok, ...exerciseInput } = parsed.data;

  try {
    // BYOK : corps `byok` ou headers X-Custom-AI-* (clé jamais stockée).
    const { result, extraHeaders } = await withFreemiumAI(request, {
      eventType: parsed.data.augmentationContext
        ? "exercise_augment"
        : "exercise_generate",
      byokFromBody: byok,
      run: (provider) => provider.generateExercise(exerciseInput),
    });

    return jsonResponse(result, request, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        ...extraHeaders,
      },
    });
  } catch (error) {
    console.error("[exercise/generate]", error);
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
