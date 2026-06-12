import { NextResponse } from "next/server";
import type { ApiErrorBody } from "./types";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081")
  .split(",")
  .map((o) => o.trim());

export function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowed ?? "*",
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
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
