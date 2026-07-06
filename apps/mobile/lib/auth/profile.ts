import { getApiUrl } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase/client";

export type UserTier = "free" | "premium";

export interface UserProfile {
  tier: UserTier;
  premiumSessionsBalance: number;
  launchAlertSubscribed: boolean;
}

export async function fetchUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const [{ data: profile, error: profileError }, { data: waitlist }] =
    await Promise.all([
      supabase
        .from("users")
        .select("tier, premium_sessions_balance")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("launch_waitlist")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (!profileError && profile) {
    return {
      tier: profile.tier === "premium" ? "premium" : "free",
      premiumSessionsBalance: Math.max(
        0,
        profile.premium_sessions_balance ?? 0
      ),
      launchAlertSubscribed: Boolean(waitlist),
    };
  }

  return bootstrapUserProfileFromApi();
}

/** Crée le profil côté API si le trigger SQL n'a pas encore tourné. */
export async function bootstrapUserProfileFromApi(): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/auth/bootstrap`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    tier?: UserTier;
    premiumSessionsBalance?: number;
  };

  const userId = session.user.id;
  const [{ data: waitlist }] = await Promise.all([
    supabase
      .from("launch_waitlist")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    tier: data.tier === "premium" ? "premium" : "free",
    premiumSessionsBalance: Math.max(0, data.premiumSessionsBalance ?? 0),
    launchAlertSubscribed: Boolean(waitlist),
  };
}

export async function subscribeLaunchAlert(
  _userId: string,
  _email: string
): Promise<{ emailSent: boolean }> {
  const { getApiUrl } = await import("@/lib/config");
  const { getSupabaseClient } = await import("@/lib/supabase/client");

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Connectez-vous pour vous inscrire à l'alerte.");
  }

  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/waitlist/launch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = (await response.json()) as {
    message?: string;
    emailSent?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Inscription impossible.");
  }

  return { emailSent: Boolean(data.emailSent) };
}
