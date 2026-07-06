import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
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

/** Upload une œuvre vers le cloud personnel connecté (compte requis). */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

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
          "Aucun cloud connecté ou upload impossible. Connectez Drive ou OneDrive dans Réglages.",
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
