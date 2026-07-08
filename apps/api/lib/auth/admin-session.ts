import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "pastek_admin_token";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function getExpectedToken(): string | null {
  const token = process.env.ADMIN_VIEWER_TOKEN?.trim();
  return token || null;
}

function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAdminViewerConfigured(): boolean {
  return Boolean(getExpectedToken());
}

export async function isAdminSession(): Promise<boolean> {
  const expected = getExpectedToken();
  if (!expected) return false;

  const jar = await cookies();
  const value = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) return false;

  return tokensMatch(value, expected);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function validateAdminToken(candidate: string): boolean {
  const expected = getExpectedToken();
  if (!expected || !candidate.trim()) return false;
  return tokensMatch(candidate.trim(), expected);
}
