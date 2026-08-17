import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { getSessionLogs } from "@/lib/sessionLog/storage";
import type { DeepSessionLog } from "@/lib/experience/types";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

function logPreview(log: DeepSessionLog): string {
  const text =
    log.sessionData?.round2?.aiAnalysis ??
    log.sessionData?.round1?.aiAnalysis ??
    log.aiReflection?.reflection ??
    log.exercise.exercise;
  return text.replace(/\s+/g, " ").trim();
}

export default function JournalScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("journal");
  const [logs, setLogs] = useState<DeepSessionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLogs(await getSessionLogs());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const sorted = useMemo(
    () => [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [logs]
  );

  return (
    <ScreenContainer refreshable onRefresh={load}>
      <ScreenNavBar onBack={() => router.back()} onHome={navigateHome} />
      <PastekScreenHero
        label={t("hero.label")}
        title={t("hero.title")}
        accent={t("hero.accent")}
        description={t("hero.description")}
        size="md"
      />

      {loading ? (
        <Text className={`text-sm ${textMuted(isDark)}`}>…</Text>
      ) : sorted.length === 0 ? (
        <View className={`rounded-2xl border px-5 py-6 ${panelBg(isDark)}`}>
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
            {t("empty")}
          </Text>
        </View>
      ) : (
        <View className="gap-3 pb-8">
          {sorted.map((log) => {
            const preview = logPreview(log);
            const hasRound2 = Boolean(log.sessionData?.round2);
            return (
              <Pressable
                key={log.id}
                onPress={() => router.push(ROUTES.journalEntry(log.id))}
                accessibilityRole="button"
                className={`rounded-2xl border px-5 py-4 active:opacity-80 ${panelBg(isDark)}`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
                    {log.exercise.impulse}
                  </Text>
                  <Text className={`text-xs ${textMuted(isDark)}`}>
                    {formatSessionDate(log.createdAt)}
                  </Text>
                </View>
                <Text className={`text-xs mb-2 ${textMuted(isDark)}`}>
                  {localizedTechniqueLabel(log.exercise.technique)} ·{" "}
                  {log.exercise.durationMinutes} min ·{" "}
                  {log.mode === "deep" ? t("modeDeep") : t("modeExpress")}
                  {hasRound2 ? ` · ${t("round2")}` : ""}
                </Text>
                <Text
                  className={`text-sm leading-5 ${textSecondary(isDark)}`}
                  numberOfLines={3}
                >
                  {preview}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
