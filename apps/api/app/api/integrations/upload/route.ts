import { z } from "zod";
import { resolveFreemiumContext } from "@/lib/auth/freemium";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { uploadArtworkToUserCloud } from "@/lib/integrations/upload-artifact";
import type { CloudProviderId } from "@/lib/integrations/types";

const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

const bodySchema = z.object({
  imageBase64: z.string().min(100).max(MAX_IMAGE_BASE64_CHARS),
  filEntryId: z.string().max(120).optional(),
  provider: z.enum(["google_drive", "onedrive"]).optional(),
});

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** Upload une œuvre vers le cloud personnel connecté (Premium BYOC). */
export async function POST(request: Request) {
  const ctx = await resolveFreemiumContext(request);
  if (!ctx.userId) {
    return errorResponse(
      request,
      { error: "Non authentifié.", code: "VALIDATION_ERROR" },
      401
    );
  }
  if (ctx.tier !== "premium") {
    return errorResponse(
      request,
      {
        error: "Upload cloud réservé aux abonnés Premium.",
        code: "VALIDATION_ERROR",
      },
      403
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
      { error: "Image invalide.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const result = await uploadArtworkToUserCloud({
    userId: ctx.userId,
    imageBase64: parsed.data.imageBase64,
    filEntryId: parsed.data.filEntryId,
    provider: parsed.data.provider as CloudProviderId | undefined,
  });

  if (!result) {
    return errorResponse(
      request,
      {
        error:
          "Aucun cloud connecté ou upload impossible. Vérifiez Premium Cloud Sync.",
        code: "AI_NOT_CONFIGURED",
      },
      503
    );
  }

  return jsonResponse(
    {
      ok: true,
      provider: result.provider,
      remoteId: result.remoteId,
      remoteUrl: result.remoteUrl,
    },
    request
  );
}
