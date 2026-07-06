import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { getSupabaseClient } from "./client";
import { getAuthRedirectUri } from "./redirect";
import { createSessionFromAuthUrl } from "./sessionFromUrl";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithMagicLink(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: getAuthRedirectUri(),
    },
  });

  if (error) throw error;
}

export async function signInWithOAuth(
  provider: "google" | "azure"
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const redirectTo = getAuthRedirectUri();

  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams:
          provider === "google"
            ? { access_type: "offline", prompt: "select_account" }
            : undefined,
      },
    });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) {
    throw new Error("Impossible d'ouvrir la connexion.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success") {
    await createSessionFromAuthUrl(result.url);
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
