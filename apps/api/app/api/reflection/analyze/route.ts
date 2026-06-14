import { z } from "zod";
import { getAIProvider } from "@/lib/ai";
import { artisticTechniqueSchema } from "@/lib/techniques";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

/** ~3 Mo en base64 — compatible limite corps Vercel (~4,5 Mo). */
const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

const bodySchema = z.object({
  imageBase64: z
    .string()
    .min(100)
    .max(MAX_IMAGE_BASE64_CHARS, {
      message: "Image trop lourde (maximum 3 Mo environ).",
    }),
  impulse: z.string().max(200).optional(),
  technique: artisticTechniqueSchema.optional(),
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
      const tooLarge = parsed.error.issues.some((issue) =>
        issue.path.includes("imageBase64")
      );
      return errorResponse(
        request,
        {
          error: tooLarge
            ? "Photo trop lourde (maximum 3 Mo). Choisissez une image plus légère ou reprenez la photo."
            : "Image ou contexte invalide.",
          code: tooLarge ? "IMAGE_TOO_LARGE" : "VALIDATION_ERROR",
        },
        400
      );
    }

    const provider = getAIProvider();
    const result = await provider.analyzeArtwork(parsed.data);

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
    JSON.stringify({ message: "Utilisez POST avec { imageBase64, impulse?, technique? }" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
