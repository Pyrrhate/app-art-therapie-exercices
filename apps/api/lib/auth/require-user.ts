import { errorResponse } from "@/lib/cors";
import { resolveFreemiumContext, type FreemiumContext } from "./freemium";

/** Utilisateur authentifié (tous tiers) — requis pour Drive / upload cloud. */
export async function requireAuthenticatedUser(
  request: Request
): Promise<
  | { ctx: FreemiumContext & { userId: string } }
  | { error: Response }
> {
  const ctx = await resolveFreemiumContext(request);
  if (!ctx.userId) {
    return {
      error: errorResponse(
        request,
        { error: "Non authentifié.", code: "VALIDATION_ERROR" },
        401
      ),
    };
  }
  return { ctx: { ...ctx, userId: ctx.userId } };
}
