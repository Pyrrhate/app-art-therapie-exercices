import { resolveFreemiumContext } from "@/lib/auth/freemium";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** Initialise ou retourne le profil freemium (crédits, tier). */
export async function GET(request: Request) {
  const ctx = await resolveFreemiumContext(request);
  if (!ctx.userId) {
    return errorResponse(
      request,
      { error: "Non authentifié.", code: "VALIDATION_ERROR" },
      401
    );
  }

  return jsonResponse(
    {
      tier: ctx.tier,
      premiumSessionsBalance: ctx.premiumSessionsBalance,
      usePremiumLlm: ctx.usePremiumLlm,
    },
    request
  );
}
