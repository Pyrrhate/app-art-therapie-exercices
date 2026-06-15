import { z } from "zod";
import { getAIProvider } from "@/lib/ai";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

const bodySchema = z.object({
  imageBase64: z
    .string()
    .min(100)
    .max(MAX_IMAGE_BASE64_CHARS, {
      message: "Image trop lourde (maximum 3 Mo environ).",
    }),
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
      const tooLarge = parsed.error.issues.some((issue) =>
        issue.path.includes("imageBase64")
      );
      return errorResponse(
        request,
        {
          error: tooLarge
            ? "Photo trop lourde (maximum 3 Mo)."
            : parsed.error.issues[0]?.message ?? "Image invalide.",
          code: tooLarge ? "IMAGE_TOO_LARGE" : "VALIDATION_ERROR",
        },
        400
      );
    }

    const provider = getAIProvider();
    if (typeof provider.transcribeHandwriting !== "function") {
      return errorResponse(
        request,
        { error: "OCR indisponible.", code: "AI_NOT_CONFIGURED" },
        503
      );
    }

    const result = await provider.transcribeHandwriting(parsed.data.imageBase64);

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
    JSON.stringify({ message: "Utilisez POST avec { imageBase64 }" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
