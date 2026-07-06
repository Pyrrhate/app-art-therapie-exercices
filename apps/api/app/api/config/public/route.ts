import { handleOptions, jsonResponse } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** Config client publique (clé anon Supabase — conçue pour être exposée). */
export async function GET(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ configured: false }, request);
  }

  return jsonResponse(
    {
      configured: true,
      supabaseUrl,
      supabaseAnonKey,
    },
    request
  );
}
