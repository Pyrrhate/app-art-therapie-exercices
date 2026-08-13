import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { TechniquePicker } from "@/components/TechniquePicker";
import { AccentCard } from "@/components/ui/Card";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import {
  getSeasonCatalogText,
  getSeasonRunConstraint,
  getSeasonRunTitle,
  SEASON_CATALOG,
  type SeasonTranslator,
} from "@/lib/seasons/catalog";
import { applyActiveSeasonToRitual } from "@/lib/seasons/apply";
import {
  abandonActiveSeason,
  getSeasonsState,
  practicedToday,
  seasonDayIndex,
  startCatalogSeason,
  startCustomSeason,
} from "@/lib/seasons/storage";
import type { SeasonDuration, SeasonRun, SeasonsState } from "@/lib/seasons/types";
import { useEnabledTechniques } from "@/lib/techniques/managed";
import type { ArtisticTechnique } from "@/lib/types";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const DURATIONS: SeasonDuration[] = [7, 10, 14];

async function confirmAbandon(
  title: string,
  t: SeasonTranslator
): Promise<boolean> {
  const message = t("confirm.leaveBody", { title });
  if (Platform.OS === "web") {
    return window.confirm(`${t("confirm.leaveTitle")}\n\n${message}`);
  }
  return new Promise((resolve) => {
    Alert.alert(t("confirm.leaveTitle"), message, [
      {
        text: t("confirm.stay"),
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: t("confirm.leave"),
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

function SeasonProgress({ run }: { run: SeasonRun }) {
  const isDark = useIsDark();
  const { t } = useTranslation("seasons");
  const day = Math.min(seasonDayIndex(run), run.durationDays);
  const sessions = run.completedDates.length;
  const todayDone = practicedToday(run);
  const title = getSeasonRunTitle(run, t);

  return (
    <AccentCard className="gap-3 mb-6">
      <Text className="text-sage-600 text-xs uppercase tracking-wider">
        {t("progress.label")}
      </Text>
      <Text className={`font-display text-2xl ${textPrimary(isDark)}`}>
        {title}
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {t("progress.day", { day, total: run.durationDays })}
        {" · "}
        {sessions === 0
          ? t("progress.noSession")
          : t("progress.sessions", { count: sessions })}
        {todayDone ? t("progress.todayDone") : ""}
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {getSeasonRunConstraint(run, t)}
      </Text>
      <PrimaryButton
        label={
          todayDone ? t("progress.continueToday") : t("progress.continue")
        }
        onPress={() => {
          void applyActiveSeasonToRitual().then(() => {
            router.push(ROUTES.ritual);
          });
        }}
      />
      <PrimaryButton
        label={t("progress.leave")}
        variant="ghost"
        onPress={() => {
          void (async () => {
            const ok = await confirmAbandon(title, t);
            if (!ok) return;
            await abandonActiveSeason();
            router.replace(ROUTES.seasons);
          })();
        }}
      />
    </AccentCard>
  );
}

export default function SeasonsScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("seasons");
  const techniques = useEnabledTechniques();
  const [state, setState] = useState<SeasonsState | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customConstraint, setCustomConstraint] = useState("");
  const [customDays, setCustomDays] = useState<SeasonDuration>(7);
  const [customTechnique, setCustomTechnique] =
    useState<ArtisticTechnique | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState(await getSeasonsState());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function beginCatalog(id: string) {
    if (active) {
      const ok = await confirmAbandon(getSeasonRunTitle(active, t), t);
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      await startCatalogSeason(id);
      await applyActiveSeasonToRitual({ preferSuggestedImpulse: true });
      router.push(ROUTES.ritual);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.startFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function beginCustom() {
    if (active) {
      const ok = await confirmAbandon(getSeasonRunTitle(active, t), t);
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      await startCustomSeason({
        title: customTitle,
        constraint: customConstraint,
        durationDays: customDays,
        suggestedTechnique: customTechnique ?? undefined,
      });
      await applyActiveSeasonToRitual({ preferSuggestedImpulse: false });
      router.push(ROUTES.ritual);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.startFailed"));
    } finally {
      setBusy(false);
    }
  }

  const active = state?.active ?? null;
  const history = state?.history ?? [];

  return (
    <ScreenContainer scrollable refreshable onRefresh={load} compactTop>
      <ScreenNavBar backLabel={t("nav.backHome")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("hero.label")}
        title={t("hero.title")}
        accent={t("hero.accent")}
        description={t("hero.description")}
        className="mb-6"
      />

      {active ? <SeasonProgress run={active} /> : null}

      <Text className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${textMuted(isDark)}`}>
        {active ? t("list.afterThisOne") : t("list.proposed")}
      </Text>

      <View className="gap-3 mb-8">
        {SEASON_CATALOG.map((def) => (
          <View
            key={def.id}
            className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`font-display text-xl ${textPrimary(isDark)}`}>
                {getSeasonCatalogText(def.id, "title", t, def.title)}
              </Text>
              <Text className={`text-xs ${textMuted(isDark)}`}>
                {t("list.days", { count: def.durationDays })}
              </Text>
            </View>
            <Text className={`text-sm leading-6 mb-3 ${textSecondary(isDark)}`}>
              {getSeasonCatalogText(def.id, "invitation", t, def.invitation)}
            </Text>
            <Text className={`text-xs leading-5 mb-4 ${textMuted(isDark)}`}>
              {t("list.constraint", {
                constraint: getSeasonCatalogText(
                  def.id,
                  "constraint",
                  t,
                  def.constraint
                ),
              })}
            </Text>
            <PrimaryButton
              label={active ? t("list.replaceAndStart") : t("list.start")}
              onPress={() => void beginCatalog(def.id)}
              disabled={busy}
              variant={active ? "ghost" : "primary"}
            />
          </View>
        ))}
      </View>

      <Pressable onPress={() => setShowCustom((v) => !v)} className="mb-3">
        <Text className="text-sage-600 text-sm font-medium">
          {showCustom ? t("custom.hide") : t("custom.show")}
        </Text>
      </Pressable>

      {showCustom ? (
        <View className={`rounded-3xl border px-5 py-5 mb-8 gap-4 ${panelBg(isDark)}`}>
          <TextInput
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder={t("custom.titlePlaceholder")}
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "border-sand-600 bg-sand-900 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />
          <TextInput
            value={customConstraint}
            onChangeText={setCustomConstraint}
            placeholder={t("custom.constraintPlaceholder")}
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            multiline
            className={`rounded-2xl border px-4 py-3 text-base min-h-[88px] ${
              isDark
                ? "border-sand-600 bg-sand-900 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />
          <View className="flex-row flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setCustomDays(d)}
                className={`rounded-full px-3 py-1.5 border ${
                  customDays === d
                    ? "bg-sage-500 border-sage-500"
                    : isDark
                      ? "border-sand-600"
                      : "border-sand-200"
                }`}
              >
                <Text
                  className={`text-xs ${
                    customDays === d ? "text-white font-medium" : textMuted(isDark)
                  }`}
                >
                  {t("list.days", { count: d })}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className={`text-sm font-medium ${textSecondary(isDark)}`}>
            {t("custom.techniqueLabel")}
          </Text>
          <TechniquePicker
            selected={customTechnique}
            onSelect={(t) =>
              setCustomTechnique((current) => (current === t ? null : t))
            }
            techniques={techniques}
          />
          <PrimaryButton
            label={t("custom.start")}
            onPress={() => void beginCustom()}
            disabled={busy}
          />
        </View>
      ) : null}

      {error ? (
        <Text className="text-red-500 text-sm mb-4 leading-5">{error}</Text>
      ) : null}

      {history.length > 0 ? (
        <View className="pb-8">
          <Text
            className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${textMuted(isDark)}`}
          >
            {t("history.title")}
          </Text>
          {history.map((run) => (
            <View key={run.id} className="mb-3">
              <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
                {getSeasonRunTitle(run, t)}
              </Text>
              <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
                {run.status === "completed"
                  ? t("history.completed")
                  : t("history.abandoned")}
                {" · "}
                {t("progress.sessions", { count: run.completedDates.length })}
                {" · "}
                {t("list.days", { count: run.durationDays })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
