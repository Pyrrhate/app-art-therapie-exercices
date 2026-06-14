import { NextResponse } from "next/server";
import type { ApiErrorBody } from "./types";

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ??
  "http://localhost:8081,http://localhost:8082,http://localhost:19006,https://pastek-art.eu,https://www.pastek-art.eu"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin) || isLocalDevOrigin(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app")) return true;
    if (hostname.endsWith(".pastek-art.eu")) return true;
  } catch {
    return false;
  }

  return false;
}

function resolveAllowedOrigin(origin: string | null): string | null {
  if (!origin) {
    return ALLOWED_ORIGINS[0] ?? "*";
  }

  if (isAllowedOrigin(origin)) {
    return origin;
  }

  return null;
}

export function corsHeaders(origin: string | null): HeadersInit {
  const allowed = resolveAllowedOrigin(origin);
  if (!allowed) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function jsonResponse<T>(
  data: T,
  request: Request,
  init?: ResponseInit
): NextResponse<T> {
  const origin = request.headers.get("origin");
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders(origin),
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(
  request: Request,
  body: ApiErrorBody,
  status: number
): NextResponse<ApiErrorBody> {
  return jsonResponse(body, request, { status });
}

export function handleOptions(request: Request): NextResponse {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  if (origin && Object.keys(headers).length === 0) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
