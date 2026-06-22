import { useCallback, useState } from "react";
import { router } from "expo-router";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import { getTechniqueLabel } from "@/constants";
import { hydrateRitualFromDraft } from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { useRitualStore } from "@/lib/store";
import { Text } from "react-native";
import { useFocusEffect } from "expo-router";

interface RitualDraftBannerProps {
  className?: string;
}

export function RitualDraftBanner({ className = "mb-4" }: RitualDraftBannerProps) {
  const isDark = useIsDark();
  const [draft, setDraft] = useState<RitualDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getRitualDraft().then(setDraft);
    }, [])
  );

  if (!draft) return null;

  function handleContinue() {
    hydrateRitualFromDraft(draft!);
    router.push(draft!.step === "reflection" ? "/reflection" : "/exercise");
  }

  function handleDismiss() {
    useRitualStore.getState().reset();
    setDraft(null);
  }

  return (
    <AccentCard className={`gap-2 ${className}`}>
      <Text className="text-sage-600 font-medium text-sm">Rituel en cours</Text>
      <Text className={`text-sm leading-5 ${textSecondary(isDark)}`} numberOfLines={2}>
        {draft.impulse} · {getTechniqueLabel(draft.technique)}
      </Text>
      <Text className={`text-xs ${textMuted(isDark)}`}>
        {draft.step === "reflection"
          ? "Étape : capture & réflexion"
          : "Étape : exercice"}
      </Text>
      <PrimaryButton label="Reprendre" onPress={handleContinue} align="stretch" />
      <PrimaryButton label="Abandonner" onPress={handleDismiss} variant="ghost" align="stretch" />
    </AccentCard>
  );
}
