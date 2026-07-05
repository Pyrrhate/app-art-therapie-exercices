import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton } from "@/components/ui/Button";
import { showAlert } from "@/lib/alert";
import {
  subscribeLaunchAlert,
  type UserProfile,
} from "@/lib/auth/profile";
import { useAuthStore } from "@/lib/auth/store";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface LaunchWaitlistCardProps {
  profile: UserProfile;
  email?: string | null;
  className?: string;
}

/** Affiché quand les crédits Premium gratuits sont épuisés (compte free). */
export function LaunchWaitlistCard({
  profile,
  email,
  className = "",
}: LaunchWaitlistCardProps) {
  const isDark = useIsDark();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const userId = useAuthStore((s) => s.user?.id);
  const [busy, setBusy] = useState(false);

  if (profile.tier === "premium" || profile.premiumSessionsBalance > 0) {
    return null;
  }

  const cardClass = isDark
    ? "border-clay-500/30 bg-sand-800"
    : "border-sand-200 bg-sand-50";

  if (profile.launchAlertSubscribed) {
    return (
      <View
        className={`rounded-3xl border px-5 py-4 gap-2 ${cardClass} ${className}`}
      >
        <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
          Lancement officiel
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          Vous serez prévenu·e par email dès l&apos;ouverture de Pastek Art
          Premium. En attendant, vos créations restent disponibles en mode
          standard.
        </Text>
        {email ? (
          <Text className={`text-xs ${textMuted(isDark)}`}>{email}</Text>
        ) : null}
      </View>
    );
  }

  async function handleSubscribe() {
    if (!userId || !email?.includes("@")) {
      showAlert(
        "Email requis",
        "Votre compte doit avoir une adresse email valide."
      );
      return;
    }

    setBusy(true);
    try {
      const { emailSent } = await subscribeLaunchAlert(userId, email);
      await refreshProfile();
      showAlert(
        "Inscription enregistrée",
        emailSent
          ? "Nous vous écrirons au lancement officiel — vérifiez votre boîte mail."
          : "Nous vous écrirons dès le lancement officiel de Pastek Art Premium."
      );
    } catch (error) {
      showAlert(
        "Inscription impossible",
        error instanceof Error ? error.message : "Réessayez dans un instant."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      className={`rounded-3xl border px-5 py-5 gap-3 ${cardClass} ${className}`}
    >
      <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
        Crédits Premium utilisés
      </Text>
      <Text className={`font-medium ${textPrimary(isDark)}`}>
        Vos 3 générations Premium offertes sont terminées
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        L&apos;expérience standard reste disponible gratuitement. Inscrivez-vous
        pour être alerté·e du lancement officiel de Pastek Art Premium.
      </Text>
      <PrimaryButton
        label={busy ? "Inscription…" : "M'alerter pour le lancement"}
        onPress={() => void handleSubscribe()}
        disabled={busy}
      />
      {busy ? <ActivityIndicator color="#496349" /> : null}
      <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
        Pas de spam — un seul email au lancement. Désinscription possible à tout
        moment.
      </Text>
    </View>
  );
}

export function PremiumCreditsBadge({
  profile,
  className = "",
}: {
  profile: UserProfile;
  className?: string;
}) {
  const isDark = useIsDark();

  if (profile.tier === "premium") {
    return (
      <Text className={`text-xs leading-5 ${textMuted(isDark)} ${className}`}>
        Abonnement Premium actif — générations illimitées.
      </Text>
    );
  }

  if (profile.premiumSessionsBalance > 0) {
    const n = profile.premiumSessionsBalance;
    return (
      <Text className={`text-xs leading-5 ${textMuted(isDark)} ${className}`}>
        {n} génération{n > 1 ? "s" : ""} Premium restante{n > 1 ? "s" : ""} (offre
        compte).
      </Text>
    );
  }

  return null;
}
