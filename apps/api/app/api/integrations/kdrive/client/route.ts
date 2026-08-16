/**
 * Relais Infomaniak kDrive (local-first).
 * Le jeton API Infomaniak est fourni par le client à chaque requête
 * et n'est jamais persisté côté Pastek.
 */
import { z } from "zod";
import {
  downloadJsonBackup,
  probeKDrive,
  uploadArtworkBytes,
  uploadJsonBackup,
} from "@/lib/integrations/kdrive-client";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const tokenSchema = z.string().min(20).max(4096);
const driveIdSchema = z.coerce.number().int().positive().max(10_000_000_000);

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("probe"),
    token: tokenSchema,
    driveId: driveIdSchema,
  }),
  z.object({
    action: z.literal("uploadBackup"),
    token: tokenSchema,
    driveId: driveIdSchema,
    json: z.string().min(2).max(12_000_000),
  }),
  z.object({
    action: z.literal("downloadBackup"),
    token: tokenSchema,
    driveId: driveIdSchema,
  }),
  z.object({
    action: z.literal("uploadArtwork"),
    token: tokenSchema,
    driveId: driveIdSchema,
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
        const result = await probeKDrive({
          token: body.token,
          driveId: body.driveId,
        });
        return jsonResponse(result, request, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "uploadBackup": {
        const result = await uploadJsonBackup({
          token: body.token,
          driveId: body.driveId,
          json: body.json,
        });
        return jsonResponse(result, request, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "downloadBackup": {
        const json = await downloadJsonBackup({
          token: body.token,
          driveId: body.driveId,
        });
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
          driveId: body.driveId,
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
    console.warn("[kdrive/client]", (error as Error).message);
    return errorResponse(
      request,
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur Infomaniak kDrive.",
        code: "INTERNAL_ERROR",
      },
      502
    );
  }
}
