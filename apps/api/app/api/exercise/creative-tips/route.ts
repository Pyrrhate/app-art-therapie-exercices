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
  exercise: z.string().min(1).max(4000),
  development: z.string().max(2000).optional(),
  language: z.enum(["fr", "en"]).optional(),
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
          "Corps JSON invalide. Envoyez { impulse, technique, exercise }.",
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

  const { byok, ...tipsInput } = parsed.data;

  try {
    const { result, extraHeaders } = await withFreemiumAI(request, {
      eventType: "exercise_creative_tips",
      byokFromBody: byok,
      run: (provider) => provider.generateCreativeTips(tipsInput),
    });

    return jsonResponse(result, request, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        ...extraHeaders,
      },
    });
  } catch (error) {
    console.error("[exercise/creative-tips]", error);
    return errorResponse(
      request,
      { error: "Erreur interne.", code: "INTERNAL_ERROR" },
      500
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Utilisez POST avec { impulse, technique, exercise }",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
