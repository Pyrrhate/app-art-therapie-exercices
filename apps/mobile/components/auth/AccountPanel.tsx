import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  LaunchWaitlistCard,
  PremiumCreditsBadge,
} from "@/components/auth/LaunchWaitlistCard";
import { PrimaryButton } from "@/components/ui/Button";
import {
  useAuthStore,
  useIsAuthenticated,
  useUserProfile,
} from "@/lib/auth/store";
import { signOut } from "@/lib/supabase/auth";
import {
  diagnoseSupabaseConfigIssue,
  initSupabaseClient,
  isSupabaseConfigured,
  supabaseConfigIssueMessage,
} from "@/lib/supabase/client";
import { PREMIUM_SIGNUP_CREDITS } from "@art-therapie/shared";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AccountPanelProps {
  className?: string;
}

/** Connexion / déconnexion — visible dans Réglages (et réutilisable ailleurs). */
export function AccountPanel({ className = "" }: AccountPanelProps) {
  const isDark = useIsDark();
  const isAuthenticated = useIsAuthenticated();
  const email = useAuthStore((s) => s.user?.email);
  const profile = useUserProfile();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [authOpen, setAuthOpen] = useState(false);
  const [configReady, setConfigReady] = useState(isSupabaseConfigured());
  const [checkingConfig, setCheckingConfig] = useState(!isSupabaseConfigured());
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    if (configReady) return;
    void (async () => {
      const ok = await initSupabaseClient();
      if (!ok) {
        const issue = await diagnoseSupabaseConfigIssue();
        setConfigError(supabaseConfigIssueMessage(issue));
      }
      setConfigReady(ok);
      setCheckingConfig(false);
    })();
  }, [configReady]);

  async function retryConfig() {
    setCheckingConfig(true);
    setConfigError("");
    const ok = await initSupabaseClient(true);
    if (!ok) {
      const issue = await diagnoseSupabaseConfigIssue();
      setConfigError(supabaseConfigIssueMessage(issue));
    }
    setConfigReady(ok);
    setCheckingConfig(false);
  }

  if (!configReady) {
    return (
      <View className={`rounded-3xl border px-5 py-4 gap-3 ${panelBg(isDark)} ${className}`}>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {checkingConfig
            ? "Connexion au service compte…"
            : configError ||
              "Le service compte n'est pas encore disponible. Vérifiez la configuration Supabase sur Vercel API."}
        </Text>
        {!checkingConfig ? (
          <PrimaryButton
            label="Réessayer"
            onPress={() => void retryConfig()}
            variant="ghost"
            align="start"
          />
        ) : null}
      </View>
    );
  }

  return (
    <View className={`gap-3 ${className}`}>
      <View className={`rounded-3xl border px-5 py-5 gap-3 ${panelBg(isDark)}`}>
        <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
          Compte
        </Text>
        {isAuthenticated ? (
          <>
            <Text className={`font-medium ${textPrimary(isDark)}`}>
              Connecté
            </Text>
            <Text className={`text-sm ${textSecondary(isDark)}`}>
              {email ?? "Compte actif"}
            </Text>
            <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
              Votre Fil créatif se synchronise avec le cloud. Connectez Drive ou
              OneDrive dans Sauvegarde personnelle pour archiver vos œuvres.
            </Text>
            {profile ? <PremiumCreditsBadge profile={profile} /> : null}
            <PrimaryButton
              label="Se déconnecter"
              onPress={() => void signOut()}
              variant="ghost"
            />
          </>
        ) : (
          <>
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              Créez un compte gratuit pour sauvegarder votre Fil créatif dans le
              cloud et recevoir {PREMIUM_SIGNUP_CREDITS} générations Premium
              offertes.
            </Text>
            <PrimaryButton
              label="Créer un compte / Se connecter"
              onPress={() => setAuthOpen(true)}
            />
          </>
        )}
      </View>

      {isAuthenticated && profile ? (
        <LaunchWaitlistCard profile={profile} email={email} />
      ) : null}

      <AuthModal visible={authOpen} onClose={() => setAuthOpen(false)} />
    </View>
  );
}
