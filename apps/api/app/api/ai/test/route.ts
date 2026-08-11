/**
 * Test de connexion BYOK — smoke test sans persistance.
 * Corps : { provider, apiKey } — jamais logué ni stocké.
 */
import { z } from "zod";
import { createAiAdapter } from "@/lib/ai/adapter";
import { byokBodySchema, byokFromBody } from "@/lib/ai/byok";
import { GeminiProvider } from "@/lib/ai/gemini";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const bodySchema = z.object({
  byok: byokBodySchema,
  provider: z.string().optional(),
  apiKey: z.string().optional(),
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
      { error: "Trop de requêtes.", code: "RATE_LIMITED" },
      429
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      request,
      { error: "JSON invalide.", code: "VALIDATION_ERROR" },
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

  const credentials =
    byokFromBody(parsed.data.byok) ??
    byokFromBody({
      provider: parsed.data.provider,
      apiKey: parsed.data.apiKey,
    });

  if (!credentials) {
    return errorResponse(
      request,
      {
        error: "Fournisseur ou clé manquant.",
        code: "VALIDATION_ERROR",
      },
      400
    );
  }

  try {
    const provider = createAiAdapter(credentials);

    // Gemini : ping court (évite le faux négatif si le JSON exercice échoue).
    if (
      credentials.provider === "gemini" &&
      provider instanceof GeminiProvider
    ) {
      const reply = await provider.ping();
      const ok = /ok/i.test(reply);
      return jsonResponse(
        {
          ok,
          provider: credentials.provider,
          message: ok
            ? "Connexion Gemini réussie"
            : `Réponse inattendue : ${reply.slice(0, 80)}`,
        },
        request,
        {
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const result = await provider.generateExercise({
      impulse: "connexion",
      technique: "drawing",
      durationMinutes: 15,
    });

    return jsonResponse(
      {
        ok: result.source === "ai",
        provider: credentials.provider,
        message:
          result.source === "ai"
            ? "Connexion réussie"
            : result.fallbackNote ??
              "Le fournisseur n’a pas répondu correctement.",
      },
      request,
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 280)
        : "Échec de connexion au fournisseur.";
    console.warn("[ai/test]", message);
    return jsonResponse(
      {
        ok: false,
        provider: credentials.provider,
        message,
      },
      request,
      { status: 200 }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "POST { provider, apiKey } pour tester une connexion BYOK",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
