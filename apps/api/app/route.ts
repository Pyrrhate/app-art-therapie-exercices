import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    name: "Art Thérapie API",
    routes: [
      "GET /api/health",
      "POST /api/exercise/generate",
      "POST /api/reflection/analyze",
    ],
  });
}
