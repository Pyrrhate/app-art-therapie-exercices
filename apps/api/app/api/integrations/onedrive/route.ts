import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import {
  buildOneDriveAuthUrl,
  exchangeOneDriveCode,
  isOneDriveConfigured,
} from "@/lib/integrations/onedrive";
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (code && state) {
    const userId = verifyOAuthState(state, "onedrive");
    if (!userId) {
      return errorResponse(
        request,
        {
          error: "Session OAuth invalide ou expirée. Reconnectez OneDrive.",
          code: "VALIDATION_ERROR",
        },
        400
      );
    }

    const exchanged = await exchangeOneDriveCode(code);
    if (!exchanged) {
      return errorResponse(
        request,
        { error: "Échec de la connexion OneDrive.", code: "INTERNAL_ERROR" },
        502
      );
    }

    const saved = await saveCloudIntegration(
      userId,
      "onedrive",
      exchanged.accountId,
      exchanged.tokens
    );

    if (!saved) {
      return errorResponse(
        request,
        {
          error:
            "Connexion OneDrive OK mais enregistrement impossible. Vérifiez INTEGRATION_ENCRYPTION_KEY.",
          code: "INTERNAL_ERROR",
        },
        500
      );
    }

    return Response.redirect(integrationReturnUrl("onedrive"), 302);
  }

  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const row = await getCloudIntegration(ctx.userId, "onedrive");
  const body: CloudIntegrationStatus = {
    provider: "onedrive",
    connected: Boolean(row?.access_token_encrypted),
    connectedAt: row?.connected_at ?? null,
    providerAccountId: row?.provider_account_id ?? null,
    configured: isOneDriveConfigured(),
  };

  return jsonResponse(body, request);
}

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
    await disconnectCloudIntegration(ctx.userId, "onedrive");
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

  const authUrl = buildOneDriveAuthUrl(ctx.userId);
  if (!authUrl) {
    const response: CloudConnectResponse = {
      status: "stub",
      message:
        "OneDrive OAuth non configuré (ONEDRIVE_CLIENT_ID / SECRET sur Vercel).",
    };
    return jsonResponse(response, request, { status: 503 });
  }

  const response: CloudConnectResponse = { status: "oauth", authUrl };
  return jsonResponse(response, request);
}
