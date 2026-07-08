import { z } from "zod";
import { generateNuanceMirror } from "@/lib/ai/nuance-mirror";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const colorSchema = z.object({
  hex: z.string().min(4).max(16),
  label: z.string().min(1).max(80),
});

const bodySchema = z.object({
  colors: z.array(colorSchema).min(1).max(12),
  harmonyName: z.string().max(80).optional(),
  discoveredElements: z.array(z.string().min(1).max(40)).max(8).optional(),
  revealedCount: z.number().int().min(1).max(64),
  totalCells: z.number().int().min(1).max(64),
});

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  const rate = checkRateLimit(`nuance-mirror:${getClientId(request)}`);
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

  const result = await generateNuanceMirror(parsed.data);
  return jsonResponse(result, request);
}

export async function GET() {
  return new Response(JSON.stringify({ message: "Utilisez POST" }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...corsHeaders(null) },
  });
}
