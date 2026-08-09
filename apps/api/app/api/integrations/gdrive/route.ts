import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { decryptSecret } from "@/lib/crypto/secrets";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import {
  buildGoogleDriveAuthUrl,
  exchangeGoogleDriveCode,
  isGoogleDriveConfigured,
  revokeGoogleDriveToken,
} from "@/lib/integrations/google-drive";
import {
  integrationReturnUrl,
  verifyOAuthState,
} from "@/lib/integrations/oauth-state";
import {
  disconnectCloudIntegration,
  getCloudIntegration,
  saveCloudIntegration,
} from "@/lib/integrations/storage";
import type {
  CloudConnectResponse,
  CloudIntegrationStatus,
} from "@/lib/integrations/types";

async function requireAuth(request: Request) {
  return requireAuthenticatedUser(request);
}

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** GET — statut (auth requis) ou callback OAuth (?code=&state=…) */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (code && state) {
    const userId = verifyOAuthState(state, "google_drive");
    if (!userId) {
      return errorResponse(
        request,
        {
          error: "Session OAuth invalide ou expirée. Reconnectez Google Drive.",
          code: "VALIDATION_ERROR",
        },
        400
      );
    }

    const exchanged = await exchangeGoogleDriveCode(code);
    if (!exchanged) {
      return errorResponse(
        request,
        {
          error: "Échec de la connexion Google Drive.",
          code: "INTERNAL_ERROR",
        },
        502
      );
    }

    const saved = await saveCloudIntegration(
      userId,
      "google_drive",
      exchanged.accountId,
      exchanged.tokens
    );

    if (!saved) {
      return errorResponse(
        request,
        {
          error:
            "Connexion Google OK mais enregistrement impossible. Vérifiez INTEGRATION_ENCRYPTION_KEY.",
          code: "INTERNAL_ERROR",
        },
        500
      );
    }

    return Response.redirect(integrationReturnUrl("google_drive"), 302);
  }

  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const row = await getCloudIntegration(ctx.userId, "google_drive");
  const body: CloudIntegrationStatus = {
    provider: "google_drive",
    connected: Boolean(row?.access_token_encrypted),
    connectedAt: row?.connected_at ?? null,
    providerAccountId: row?.provider_account_id ?? null,
    configured: isGoogleDriveConfigured(),
  };

  return jsonResponse(body, request);
}

/** POST — { action: "connect" | "disconnect" } */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return errorResponse(
      request,
      { error: "JSON invalide.", code: "VALIDATION_ERROR" },
      400
    );
  }

  if (body.action === "disconnect") {
    const row = await getCloudIntegration(ctx.userId, "google_drive");
    const access = row?.access_token_encrypted
      ? decryptSecret(row.access_token_encrypted)
      : null;
    const refresh = row?.refresh_token_encrypted
      ? decryptSecret(row.refresh_token_encrypted)
      : null;
    if (access) await revokeGoogleDriveToken(access);
    else if (refresh) await revokeGoogleDriveToken(refresh);

    await disconnectCloudIntegration(ctx.userId, "google_drive");
    const response: CloudConnectResponse = { status: "disconnected" };
    return jsonResponse(response, request);
  }

  if (body.action !== "connect") {
    return errorResponse(
      request,
      { error: "action invalide.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const authUrl = buildGoogleDriveAuthUrl(ctx.userId);
  if (!authUrl) {
    const response: CloudConnectResponse = {
      status: "stub",
      message:
        "Google Drive OAuth non configuré (GOOGLE_DRIVE_CLIENT_ID / SECRET sur Vercel).",
    };
    return jsonResponse(response, request, { status: 503 });
  }

  const response: CloudConnectResponse = { status: "oauth", authUrl };
  return jsonResponse(response, request);
}
