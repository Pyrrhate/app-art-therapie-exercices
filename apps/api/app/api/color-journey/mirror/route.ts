import { z } from "zod";
import { generateColorJourneyMirror } from "@/lib/ai/color-journey-mirror";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const choiceSchema = z.object({
  hex: z.string().min(4).max(16),
  label: z.string().min(1).max(80),
  dimensionId: z.string().min(1).max(32),
  mixRecipe: z.string().max(300).optional(),
  paintId: z.string().max(32).optional(),
});

const bodySchema = z
  .object({
    mode: z.enum(["turn", "synthesis"]),
    turn: z.number().int().min(1).max(5).optional(),
    chosen: choiceSchema.optional(),
    history: z.array(choiceSchema).min(1).max(5),
  })
  .refine(
    (data) => data.mode !== "turn" || (data.turn !== undefined && data.chosen),
    { message: "Tour et teinte requis pour le mode turn." }
  );

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  const rate = checkRateLimit(`color-mirror:${getClientId(request)}`);
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

  const result = await generateColorJourneyMirror(parsed.data);
  return jsonResponse(result, request);
}

export async function GET() {
  return new Response(JSON.stringify({ message: "Utilisez POST" }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...corsHeaders(null) },
  });
}
