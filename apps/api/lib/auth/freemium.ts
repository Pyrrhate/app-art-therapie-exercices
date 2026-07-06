import { createClient } from "@supabase/supabase-js";
import { PREMIUM_SIGNUP_CREDITS } from "@art-therapie/shared";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export type UserTier = "free" | "premium";

export interface FreemiumContext {
  userId: string | null;
  tier: UserTier;
  premiumSessionsBalance: number;
  /** Route vers Mistral (premium) si true, sinon Hugging Face (free). */
  usePremiumLlm: boolean;
  /** Décrémenter `premium_sessions_balance` après un appel IA premium réussi. */
  decrementBalanceOnSuccess: boolean;
}

const ANONYMOUS: FreemiumContext = {
  userId: null,
  tier: "free",
  premiumSessionsBalance: 0,
  usePremiumLlm: false,
  decrementBalanceOnSuccess: false,
};

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim()
  );
}

function contextFromProfile(
  userId: string,
  tier: UserTier,
  balance: number
): FreemiumContext {
  if (tier === "premium") {
    return {
      userId,
      tier: "premium",
      premiumSessionsBalance: balance,
      usePremiumLlm: true,
      decrementBalanceOnSuccess: false,
    };
  }

  if (balance > 0) {
    return {
      userId,
      tier: "free",
      premiumSessionsBalance: balance,
      usePremiumLlm: true,
      decrementBalanceOnSuccess: true,
    };
  }

  return {
    userId,
    tier: "free",
    premiumSessionsBalance: 0,
    usePremiumLlm: false,
    decrementBalanceOnSuccess: false,
  };
}

/** Résout le tier freemium à partir du JWT Supabase (header Authorization). */
export async function resolveFreemiumContext(
  request: Request
): Promise<FreemiumContext> {
  if (!isSupabaseAuthConfigured() || !isSupabaseAdminConfigured()) {
    return ANONYMOUS;
  }

  const token = extractBearerToken(request);
  if (!token) return ANONYMOUS;

  const authClient = createClient(
    process.env.SUPABASE_URL!.trim(),
    process.env.SUPABASE_ANON_KEY!.trim(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return ANONYMOUS;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return ANONYMOUS;

  const ensured = await ensureUserProfile(user.id, user.email ?? "");
  if (ensured) {
    return contextFromProfile(user.id, ensured.tier, ensured.balance);
  }

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("tier, premium_sessions_balance")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return contextFromProfile(user.id, "free", 0);
  }

  const tier = profile.tier === "premium" ? "premium" : "free";
  const balance =
    typeof profile.premium_sessions_balance === "number"
      ? Math.max(0, profile.premium_sessions_balance)
      : 0;

  return contextFromProfile(user.id, tier, balance);
}

/** Crée le profil applicatif si le trigger SQL n'a pas encore tourné. */
async function ensureUserProfile(
  userId: string,
  email: string
): Promise<{ tier: UserTier; balance: number } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data: existing } = await admin
    .from("users")
    .select("tier, premium_sessions_balance")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return {
      tier: existing.tier === "premium" ? "premium" : "free",
      balance: Math.max(0, existing.premium_sessions_balance ?? 0),
    };
  }

  const { error: insertError } = await admin.from("users").insert({
    id: userId,
    email: email || "",
    tier: "free",
    premium_sessions_balance: PREMIUM_SIGNUP_CREDITS,
  });

  if (insertError && insertError.code !== "23505") {
    console.warn("[freemium] ensure profile", insertError.message);
    return null;
  }

  const { data: created } = await admin
    .from("users")
    .select("tier, premium_sessions_balance")
    .eq("id", userId)
    .maybeSingle();

  if (!created) return null;

  return {
    tier: created.tier === "premium" ? "premium" : "free",
    balance: Math.max(0, created.premium_sessions_balance ?? 0),
  };
}

/** Consomme une session premium offerte (utilisateurs free uniquement). */
export async function consumePremiumSession(userId: string): Promise<number | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin.rpc("decrement_premium_balance", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[freemium] decrement", error.message);
    return null;
  }

  return typeof data === "number" ? data : null;
}

export function freemiumResponseHeaders(
  ctx: FreemiumContext,
  balanceAfter?: number | null
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Llm-Tier": ctx.usePremiumLlm ? "premium" : "free",
  };

  if (ctx.userId) {
    const remaining =
      balanceAfter !== undefined && balanceAfter !== null
        ? balanceAfter
        : ctx.premiumSessionsBalance;
    headers["X-Premium-Sessions-Remaining"] = String(
      ctx.tier === "premium" ? "unlimited" : remaining
    );
  }

  return headers;
}
