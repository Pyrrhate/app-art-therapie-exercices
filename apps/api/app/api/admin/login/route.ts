import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  isAdminViewerConfigured,
  validateAdminToken,
} from "@/lib/auth/admin-session";

const bodySchema = z.object({
  token: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  if (!isAdminViewerConfigured()) {
    return NextResponse.json(
      { error: "Accès admin non configuré (ADMIN_VIEWER_TOKEN)." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
  }

  if (!validateAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    parsed.data.token.trim(),
    adminSessionCookieOptions()
  );
  return response;
}
