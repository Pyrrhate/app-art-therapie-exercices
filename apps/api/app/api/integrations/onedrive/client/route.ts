/**
 * Relais OneDrive / Microsoft Graph (local-first).
 * Le jeton d'accès est fourni par le client à chaque requête
 * et n'est jamais persisté côté Pastek — aucun secret Vercel.
 */
import { z } from "zod";
import {
  downloadJsonBackup,
  probeOneDrive,
  uploadArtworkBytes,
  uploadJsonBackup,
} from "@/lib/integrations/onedrive-client";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const tokenSchema = z.string().min(40).max(16_000);

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("probe"),
    token: tokenSchema,
  }),
  z.object({
    action: z.literal("uploadBackup"),
    token: tokenSchema,
    json: z.string().min(2).max(12_000_000),
  }),
  z.object({
    action: z.literal("downloadBackup"),
    token: tokenSchema,
  }),
  z.object({
    action: z.literal("uploadArtwork"),
    token: tokenSchema,
    filename: z.string().min(1).max(180),
    mimeType: z.string().min(3).max(120),
    imageBase64: z.string().min(40).max(14_000_000),
  }),
]);

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  const rate = checkRateLimit(getClientId(request));
  if (!rate.allowed) {
    return errorResponse(
      request,
      { error: "Trop de requêtes.", code: "RATE_LIMITED" },
      429
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(
      request,
      { error: "Corps JSON invalide.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      request,
      { error: "Données invalides.", code: "VALIDATION_ERROR" },
      400
    );
  }

  try {
    const body = parsed.data;
    switch (body.action) {
      case "probe": {
        const result = await probeOneDrive(body.token);
        return jsonResponse(result, request, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "uploadBackup": {
        const result = await uploadJsonBackup({
          token: body.token,
          json: body.json,
        });
        return jsonResponse(result, request, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "downloadBackup": {
        const json = await downloadJsonBackup(body.token);
        return jsonResponse(
          { json },
          request,
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      case "uploadArtwork": {
        const dataUrlMatch = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(
          body.imageBase64.trim()
        );
        const b64 =
          dataUrlMatch?.[2] ??
          body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const binary = Buffer.from(b64, "base64");
        const result = await uploadArtworkBytes({
          token: body.token,
          filename: body.filename,
          mimeType: body.mimeType,
          bytes: binary,
        });
        return jsonResponse(
          { fileId: result?.fileId ?? null },
          request,
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      default:
        return errorResponse(
          request,
          { error: "Action inconnue.", code: "VALIDATION_ERROR" },
          400
        );
    }
  } catch (error) {
    console.warn("[onedrive/client]", (error as Error).message);
    const message =
      error instanceof Error ? error.message : "Erreur OneDrive.";
    const expired =
      /invalid.?token|expired|Lifetime.?expired|lifetime.?validation|401/i.test(
        message
      );
    return errorResponse(
      request,
      {
        error: expired
          ? `${message} — le jeton Microsoft a probablement expiré. Recollez un jeton frais (Graph Explorer ou votre app Azure).`
          : message,
        code: "INTERNAL_ERROR",
      },
      502
    );
  }
}
