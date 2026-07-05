import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { fetchUserProfile, type UserProfile } from "@/lib/auth/profile";
import { syncLocalHistoryToCloud } from "@/lib/fil/sync";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createSessionFromAuthUrl } from "@/lib/supabase/sessionFromUrl";
import { getInitialAuthCallbackUrl, parseAuthCallbackUrl } from "@/lib/supabase/redirect";
import * as Linking from "expo-linking";

interface AuthStore {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  loading: boolean;
  initialized: boolean;
  lastSyncCount: number | null;
  init: () => () => void;
  handleAuthUrl: (url: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function runCloudSync(set: (partial: Partial<AuthStore>) => void) {
  try {
    const result = await syncLocalHistoryToCloud();
    if (result.synced > 0) {
      set({ lastSyncCount: result.synced });
    }
  } catch (error) {
    console.warn("[auth] sync", error);
  }
}

async function loadProfile(
  userId: string | undefined,
  set: (partial: Partial<AuthStore>) => void
) {
  if (!userId) {
    set({ profile: null, profileLoading: false });
    return;
  }

  set({ profileLoading: true });
  try {
    const profile = await fetchUserProfile(userId);
    set({ profile, profileLoading: false });
  } catch (error) {
    console.warn("[auth] profile", error);
    set({ profile: null, profileLoading: false });
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  profileLoading: false,
  loading: true,
  initialized: false,
  lastSyncCount: null,

  refreshProfile: async () => {
    await loadProfile(get().user?.id, set);
  },

  handleAuthUrl: async (url: string) => {
    if (!parseAuthCallbackUrl(url)) return;
    try {
      await createSessionFromAuthUrl(url);
    } catch (error) {
      console.warn("[auth] callback", error);
    }
  },

  init: () => {
    if (get().initialized) {
      return () => undefined;
    }

    set({ initialized: true });

    if (!isSupabaseConfigured()) {
      set({ loading: false, session: null, user: null, profile: null });
      return () => undefined;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      set({ loading: false });
      return () => undefined;
    }

    let active = true;

    void (async () => {
      const initialUrl = await getInitialAuthCallbackUrl();
      if (initialUrl) {
        await get().handleAuthUrl(initialUrl);
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      set({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
      if (data.session?.user) {
        await loadProfile(data.session.user.id, set);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });

        if (session?.user) {
          void loadProfile(session.user.id, set);
        } else {
          set({ profile: null, profileLoading: false });
        }

        if (
          session?.user &&
          (event === "SIGNED_IN" || event === "INITIAL_SESSION")
        ) {
          void runCloudSync(set);
        }
      }
    );

    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      void get().handleAuthUrl(url);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      linkingSub.remove();
    };
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => Boolean(s.user));
}

export function useAuthLoading(): boolean {
  return useAuthStore((s) => s.loading);
}

export function useUserProfile(): UserProfile | null {
  return useAuthStore((s) => s.profile);
}
