import { z } from "zod";
import { resolveFreemiumContext } from "@/lib/auth/freemium";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  comment: z.string().max(2000).optional().nullable(),
  ai_response_text: z.string().min(10).max(12_000),
  prompt_version: z.string().min(1).max(64),
  session_id: z.string().min(1).max(128),
});

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** Enregistre un retour utilisateur sur une réflexion IA (evals loop). */
export async function POST(request: Request) {
  const rate = checkRateLimit(`feedback:${getClientId(request)}`);
  if (!rate.allowed) {
    return errorResponse(
      request,
      { error: "Trop de requêtes. Réessayez plus tard.", code: "RATE_LIMITED" },
      429
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      request,
      { error: "Corps JSON invalide.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      request,
      {
        error: parsed.error.issues[0]?.message ?? "Données invalides.",
        code: "VALIDATION_ERROR",
      },
      400
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return errorResponse(
      request,
      { error: "Service indisponible.", code: "INTERNAL_ERROR" },
      503
    );
  }

  const ctx = await resolveFreemiumContext(request);
  const comment = parsed.data.comment?.trim() || null;

  const { error } = await admin.from("feedback").insert({
    user_id: ctx.userId,
    session_id: parsed.data.session_id.trim(),
    rating: parsed.data.rating,
    comment,
    ai_response_text: parsed.data.ai_response_text.trim(),
    prompt_version: parsed.data.prompt_version.trim(),
  });

  if (error) {
    console.warn("[feedback]", error.message);
    return errorResponse(
      request,
      { error: "Enregistrement impossible.", code: "INTERNAL_ERROR" },
      500
    );
  }

  return jsonResponse({ ok: true }, request);
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Utilisez POST" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
