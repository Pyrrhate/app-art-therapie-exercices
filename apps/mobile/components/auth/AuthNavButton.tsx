import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { router } from "expo-router";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  useAuthLoading,
  useAuthStore,
  useIsAuthenticated,
} from "@/lib/auth/store";
import { ROUTES } from "@/lib/routes";
import {
  initSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { showAlert } from "@/lib/alert";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AuthNavButtonProps {
  /** Style compact pour la barre d'en-tête */
  compact?: boolean;
}

export function AuthNavButton({ compact = true }: AuthNavButtonProps) {
  const isDark = useIsDark();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const email = useAuthStore((s) => s.user?.email);
  const [authOpen, setAuthOpen] = useState(false);
  const [configReady, setConfigReady] = useState(isSupabaseConfigured());
  const [checkingConfig, setCheckingConfig] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (configReady) return;
    let active = true;
    void (async () => {
      const ok = await initSupabaseClient();
      if (active) {
        setConfigReady(ok);
        setCheckingConfig(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [configReady]);

  async function handlePress() {
    if (checkingConfig) return;

    if (!configReady) {
      const ok = await initSupabaseClient();
      setConfigReady(ok);
      if (!ok) {
        showAlert(
          "Compte indisponible",
          "La connexion cloud n'est pas encore configurée sur ce déploiement. Ajoutez SUPABASE_URL et SUPABASE_ANON_KEY sur l'API, ou EXPO_PUBLIC_SUPABASE_* sur le build mobile."
        );
        return;
      }
    }

    if (isAuthenticated) {
      router.push(ROUTES.settings);
      return;
    }

    setAuthOpen(true);
  }

  const label = (() => {
    if (checkingConfig || authLoading) return null;
    if (isAuthenticated) {
      if (!compact && email) {
        const short = email.split("@")[0];
        return short && short.length > 12 ? `${short.slice(0, 11)}…` : short;
      }
      return "Compte";
    }
    return "Connexion";
  })();

  return (
    <>
      <Pressable
        onPress={() => void handlePress()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          isAuthenticated ? "Mon compte" : "Se connecter ou créer un compte"
        }
        className={`rounded-full border px-3 py-1.5 ${
          isAuthenticated
            ? isDark
              ? "border-sand-600 bg-sand-800/80"
              : "border-sage-200 bg-sage-50"
            : isDark
              ? "border-sage-600 bg-sage-900/40"
              : "border-sage-400 bg-sage-500"
        }`}
      >
        {checkingConfig || authLoading ? (
          <ActivityIndicator
            size="small"
            color={isAuthenticated || isDark ? "#496349" : "#ffffff"}
          />
        ) : (
          <Text
            className={`text-sm font-medium ${
              isAuthenticated
                ? textPrimary(isDark)
                : isDark
                  ? "text-sage-300"
                  : "text-white"
            }`}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </Pressable>

      <AuthModal
        visible={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </>
  );
}
