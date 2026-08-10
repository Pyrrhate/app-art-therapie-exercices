/**
 * Échange OAuth Google Drive pour le client local-first.
 * Stateless : le secret reste sur l'API ; les jetons sont renvoyés une fois
 * et ne sont jamais stockés serveur.
 */
import { z } from "zod";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { isGoogleDriveConfigured } from "@/lib/integrations/google-drive";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const ALLOWED_REDIRECTS = new Set([
  "https://pastek-art.eu/app/premium-cloud",
  "https://www.pastek-art.eu/app/premium-cloud",
  "http://localhost:8081/app/premium-cloud",
  "http://localhost:8082/app/premium-cloud",
  "http://localhost:19006/app/premium-cloud",
  "http://127.0.0.1:8081/app/premium-cloud",
]);

function isAllowedRedirect(uri: string): boolean {
  if (ALLOWED_REDIRECTS.has(uri)) return true;
  try {
    const u = new URL(uri);
    if (u.pathname !== "/app/premium-cloud") return false;
    if (u.hostname.endsWith(".vercel.app")) return true;
    if (u.hostname.endsWith(".pastek-art.eu")) return true;
    return false;
  } catch {
    return false;
  }
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("exchange"),
    code: z.string().min(8).max(2048),
    codeVerifier: z.string().min(16).max(256),
    redirectUri: z.string().url().max(500),
  }),
  z.object({
    action: z.literal("refresh"),
    refreshToken: z.string().min(8).max(2048),
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

  if (!isGoogleDriveConfigured()) {
    return errorResponse(
      request,
      {
        error:
          "Google Drive non configuré sur l'API (GOOGLE_DRIVE_CLIENT_ID / SECRET).",
        code: "INTERNAL_ERROR",
      },
      503
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(
      request,
      { error: "JSON invalide.", code: "VALIDATION_ERROR" },
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

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!.trim();

  if (parsed.data.action === "exchange") {
    if (!isAllowedRedirect(parsed.data.redirectUri)) {
      return errorResponse(
        request,
        {
          error: "redirect_uri non autorisé.",
          code: "VALIDATION_ERROR",
        },
        400
      );
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: parsed.data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: parsed.data.redirectUri,
        grant_type: "authorization_code",
        code_verifier: parsed.data.codeVerifier,
      }),
    });

    const detail = await response.text();
    if (!response.ok) {
      console.warn("[gdrive client-token exchange]", detail.slice(0, 200));
      let message =
        "Échange OAuth refusé. Vérifiez que EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID est le même Client ID que GOOGLE_DRIVE_CLIENT_ID sur l'API.";
      try {
        const err = JSON.parse(detail) as {
          error?: string;
          error_description?: string;
        };
        if (err.error === "redirect_uri_mismatch") {
          message =
            "redirect_uri_mismatch — URI exacte requise : https://pastek-art.eu/app/premium-cloud";
        } else if (err.error) {
          message = `Google : ${err.error}${err.error_description ? ` — ${err.error_description}` : ""}`;
        }
      } catch {
        /* ignore */
      }
      return errorResponse(
        request,
        { error: message, code: "INTERNAL_ERROR" },
        502
      );
    }

    const data = JSON.parse(detail) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!data.access_token) {
      return errorResponse(
        request,
        { error: "Réponse Google sans access_token.", code: "INTERNAL_ERROR" },
        502
      );
    }

    return jsonResponse(
      {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresIn: data.expires_in ?? 3600,
        scope: data.scope ?? null,
      },
      request,
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: parsed.data.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const detail = await response.text();
  if (!response.ok) {
    console.warn("[gdrive client-token refresh]", detail.slice(0, 200));
    return errorResponse(
      request,
      {
        error: "Rafraîchissement Google refusé. Reconnectez Drive.",
        code: "INTERNAL_ERROR",
      },
      502
    );
  }

  const data = JSON.parse(detail) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!data.access_token) {
    return errorResponse(
      request,
      { error: "Refresh sans access_token.", code: "INTERNAL_ERROR" },
      502
    );
  }

  return jsonResponse(
    {
      accessToken: data.access_token,
      refreshToken: parsed.data.refreshToken,
      expiresIn: data.expires_in ?? 3600,
      scope: data.scope ?? null,
    },
    request,
    { headers: { "Cache-Control": "no-store" } }
  );
}
