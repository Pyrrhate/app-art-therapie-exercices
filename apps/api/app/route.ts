import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    name: "Art Thérapie API",
    routes: [
      "GET /api/health",
      "GET /api/config/public",
      "GET /api/auth/bootstrap",
      "POST /api/exercise/generate",
      "POST /api/reflection/analyze",
      "POST /api/reflection/ocr",
      "POST /api/ping-pong",
    ],
  });
}
