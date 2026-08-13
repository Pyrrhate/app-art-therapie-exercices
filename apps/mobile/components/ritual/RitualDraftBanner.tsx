import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { router, useFocusEffect } from "expo-router";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { hydrateRitualFromDraft } from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { ROUTES } from "@/lib/routes";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { useRitualStore } from "@/lib/store";

interface RitualDraftBannerProps {
  className?: string;
}

export function RitualDraftBanner({ className = "mb-4" }: RitualDraftBannerProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");
  const [draft, setDraft] = useState<RitualDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getRitualDraft().then(setDraft);
    }, [])
  );

  if (!draft) return null;

  function handleContinue() {
    hydrateRitualFromDraft(draft!);
    router.push(draft!.step === "reflection" ? ROUTES.reflection : ROUTES.exercise);
  }

  function handleDismiss() {
    useRitualStore.getState().reset();
    setDraft(null);
  }

  return (
    <AccentCard className={`gap-2 ${className}`}>
      <Text className="text-sage-600 font-medium text-sm">{t("draft.title")}</Text>
      <Text className={`text-sm leading-5 ${textSecondary(isDark)}`} numberOfLines={2}>
        {draft.impulse} · {localizedTechniqueLabel(draft.technique)}
      </Text>
      <Text className={`text-xs ${textMuted(isDark)}`}>
        {draft.step === "reflection"
          ? t("draft.stepReflection")
          : t("draft.stepExercise")}
      </Text>
      <PrimaryButton label={t("draft.resume")} onPress={handleContinue} align="stretch" />
      <PrimaryButton
        label={t("draft.dismiss")}
        onPress={handleDismiss}
        variant="ghost"
        align="stretch"
      />
    </AccentCard>
  );
}
