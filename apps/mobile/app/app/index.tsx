import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ModuleCard } from "@/components/home/ModuleCard";
import { ModuleQuickTile } from "@/components/home/ModuleQuickTile";
import { AppHeader } from "@/components/ui/AppHeader";
import { PastekIcon } from "@/components/ui/ModuleIcon";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ModuleIconId } from "@/components/ui/ModuleIcon";
import { formatSessionDate } from "@/constants";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { getFilEntries } from "@/lib/fil/storage";
import {
  FIL_SOURCE_META,
  getFilSourceLabel,
  type FilEntry,
} from "@/lib/fil/types";
import { navigateSiteHome } from "@/lib/navigation";
import { ROUTES, type ModuleAmorceRoute } from "@/lib/routes";
import {
  getSeasonRunConstraint,
  getSeasonRunTitle,
} from "@/lib/seasons/catalog";
import {
  getActiveSeasonRun,
  practicedToday,
  seasonDayIndex,
} from "@/lib/seasons/storage";
import { applyActiveSeasonToRitual } from "@/lib/seasons/apply";
import type { SeasonRun } from "@/lib/seasons/types";
import { hydrateRitualFromDraft } from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { useRitualStore } from "@/lib/store";
import { useLanguageStore } from "@/lib/i18n/languageStore";

type ModuleDef = {
  title: string;
  icon: ModuleIconId;
  description: string;
  route: ModuleAmorceRoute;
};

const MODULE_DEFS: {
  key: string;
  icon: ModuleIconId;
  route: ModuleAmorceRoute;
}[] = [
  { key: "pingPong", icon: "ping-pong", route: ROUTES.pingPong },
  { key: "colorJourney", icon: "color-journey", route: ROUTES.colorJourney },
  {
    key: "emotionExplorer",
    icon: "emotion-explorer",
    route: ROUTES.emotionExplorer,
  },
  { key: "nuanceFinder", icon: "nuance-finder", route: ROUTES.nuanceFinder },
  {
    key: "threeGestures",
    icon: "three-gestures",
    route: ROUTES.threeGestures,
  },
  { key: "oneRule", icon: "one-rule", route: ROUTES.oneRule },
];

const WIDE_LAYOUT_MIN = 720;

export default function WelcomeScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation(["app", "common", "amorces"]);
  const { t: tFil } = useTranslation("fil");
  const { t: tSeasons } = useTranslation("seasons");
  const language = useLanguageStore((s) => s.language);
  const modules: ModuleDef[] = MODULE_DEFS.map((mod) => ({
    icon: mod.icon,
    route: mod.route,
    title: t(`amorces:modules.${mod.key}.title`),
    description: t(`amorces:modules.${mod.key}.description`),
  }));
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_MIN;
  const scrollRef = useRef<ScrollView>(null);
  const [tracesY, setTracesY] = useState(0);
  const [draft, setDraft] = useState<RitualDraft | null>(null);
  const [recentFil, setRecentFil] = useState<FilEntry[]>([]);
  const [season, setSeason] = useState<SeasonRun | null>(null);

  const loadDraft = useCallback(async () => {
    setDraft(await getRitualDraft());
    const fil = await getFilEntries();
    setRecentFil(fil.slice(0, isWide ? 3 : 2));
    setSeason(await getActiveSeasonRun());
  }, [isWide]);

  useFocusEffect(
    useCallback(() => {
      void loadDraft();
    }, [loadDraft])
  );

  function scrollToTraces() {
    scrollRef.current?.scrollTo({ y: Math.max(0, tracesY - 24), animated: true });
  }

  function handleContinueDraft() {
    if (!draft) return;
    hydrateRitualFromDraft(draft);
    router.push(draft.step === "reflection" ? ROUTES.reflection : ROUTES.exercise);
  }

  function handleDismissDraft() {
    useRitualStore.getState().reset();
    setDraft(null);
  }

  return (
    <ScreenContainer scrollable refreshable scrollRef={scrollRef} contentMaxWidth={720} compactTop>
      <AppHeader compact onNavigateTraces={scrollToTraces} />

      <PastekScreenHero
        label={t("home.label")}
        title={isWide ? t("home.titleWide") : t("home.titleNarrow")}
        accent={isWide ? t("home.accentWide") : t("home.accentNarrow")}
        description={isWide ? t("home.descriptionWide") : undefined}
        onDescriptionPress={navigateSiteHome}
        size={isWide ? "lg" : "md"}
        className={isWide ? "mb-6" : "mb-4"}
      />

      {draft && (
        <AccentCard className={`gap-2 ${isWide ? "mb-6" : "mb-3"}`}>
          <Text className="text-sage-600 font-medium text-sm">
            {t("home.draftTitle")}
          </Text>
          <Text
            className={`text-sm leading-5 ${textSecondary(isDark)}`}
            numberOfLines={isWide ? undefined : 2}
          >
            {draft.impulse} · {localizedTechniqueLabel(draft.technique)}
          </Text>
          {!isWide ? null : (
            <Text className={`text-xs ${textMuted(isDark)}`}>
              {draft.step === "reflection"
                ? t("home.draftStepReflection")
                : t("home.draftStepExercise")}
            </Text>
          )}
          <View className="flex-row gap-2 mt-1">
            <View className="flex-1">
              <PrimaryButton
                label={t("home.draftAbandon")}
                onPress={handleDismissDraft}
                variant="ghost"
                align="stretch"
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={t("common:actions.continue")}
                onPress={handleContinueDraft}
                align="stretch"
              />
            </View>
          </View>
        </AccentCard>
      )}

      {season ? (
        <AccentCard className={`gap-2 ${isWide ? "mb-6" : "mb-3"}`}>
          <Text className="text-sage-600 font-medium text-sm">
            {t("home.seasonOngoing")}
          </Text>
          <Text className={`text-base font-medium ${textSecondary(isDark)}`}>
            {t("home.seasonDay", {
              title: getSeasonRunTitle(season, tSeasons),
              day: Math.min(seasonDayIndex(season), season.durationDays),
              total: season.durationDays,
            })}
          </Text>
          <Text className={`text-sm leading-5 ${textMuted(isDark)}`} numberOfLines={2}>
            {getSeasonRunConstraint(season, tSeasons)}
            {practicedToday(season) ? t("home.seasonPracticedToday") : ""}
          </Text>
          <View className="flex-row gap-2 mt-1">
            <View className="flex-1">
              <PrimaryButton
                label={t("home.seasonSee")}
                onPress={() => router.push(ROUTES.seasons)}
                variant="ghost"
                align="stretch"
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={t("common:actions.continue")}
                onPress={() => {
                  void applyActiveSeasonToRitual().then(() => {
                    router.push(ROUTES.ritual);
                  });
                }}
                align="stretch"
              />
            </View>
          </View>
        </AccentCard>
      ) : null}

      <View className="gap-3">
        <View
          className={`border-t pt-8 ${
            isDark ? "border-sand-700" : "border-sand-200"
          }`}
        >
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label={t("home.customMode")}
                onPress={() => router.push(ROUTES.custom)}
                variant="secondary"
                align="stretch"
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={t("home.startExercise")}
                onPress={() => router.push(ROUTES.ritual)}
                showArrow
                align="stretch"
              />
            </View>
          </View>
        </View>
        {!season ? (
          <View className="items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={t("home.season")}
                onPress={() => router.push(ROUTES.seasons)}
                variant="ghost"
                align="stretch"
              />
            </View>
          </View>
        ) : null}
      </View>

      <View
        className={`border-t ${isDark ? "border-sand-700" : "border-sand-200"} ${
          isWide ? "mt-8 mb-2 pt-8" : "mt-5 mb-1 pt-5"
        }`}
      >
        {isWide ? (
          <SectionHeader
            label={t("home.amorcesLabel")}
            title={t("home.amorcesTitle")}
            accent={t("home.amorcesAccent")}
            titleEnd={t("home.amorcesEnd")}
            className="mb-4"
          />
        ) : (
          <Text
            className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${textMuted(isDark)}`}
          >
            {t("home.amorcesLabel")}
          </Text>
        )}

        <View className="flex-row flex-wrap gap-2.5 items-stretch">
          {modules.map((mod) =>
            isWide ? (
              <ModuleCard key={mod.route} {...mod} />
            ) : (
              <ModuleQuickTile key={mod.route} {...mod} />
            )
          )}
        </View>
      </View>

      <View
        className={`border-t gap-4 ${isDark ? "border-sand-700" : "border-sand-200"} ${
          isWide ? "pt-12 mt-10" : "pt-8 mt-6"
        }`}
        onLayout={(e) => setTracesY(e.nativeEvent.layout.y)}
      >
        {isWide ? (
          <SectionHeader
            label={t("home.tracesLabel")}
            title={t("home.tracesTitle")}
            accent={t("home.tracesAccent")}
            titleEnd={t("home.tracesEnd")}
          />
        ) : (
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-xs uppercase tracking-[0.18em] font-medium ${textMuted(isDark)}`}>
              {t("header.fil")}
            </Text>
            <Pressable onPress={() => router.push(ROUTES.fil)} hitSlop={8}>
              <Text className="text-sage-500 text-sm font-medium">
                {t("common:actions.seeAll")}
              </Text>
            </Pressable>
          </View>
        )}

        {isWide ? (
          <View className="items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={t("home.openFil")}
                onPress={() => router.push(ROUTES.fil)}
                align="stretch"
              />
            </View>
          </View>
        ) : null}

        {recentFil.length > 0 ? (
          <View className="gap-2">
            {recentFil.map((entry) => {
              const meta = FIL_SOURCE_META[entry.source];
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push(ROUTES.filEntry(entry.id))}
                  className={`rounded-2xl border px-3 py-2.5 flex-row items-center gap-3 ${
                    isDark ? "border-sand-700 bg-sand-800/50" : "border-sand-200 bg-white/80"
                  }`}
                >
                  <PastekIcon
                    id={meta.icon}
                    boxSize={32}
                    size={20}
                    className="mb-0"
                  />
                  <View className="flex-1 min-w-0">
                    <Text className={`text-xs ${textMuted(isDark)}`} numberOfLines={1}>
                      {formatSessionDate(entry.createdAt, language)} ·{" "}
                      {getFilSourceLabel(entry.source, tFil)}
                    </Text>
                    <Text
                      className={`text-sm font-medium ${textSecondary(isDark)}`}
                      numberOfLines={1}
                    >
                      {entry.summary}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable
            onPress={() => router.push(ROUTES.fil)}
            className={`rounded-2xl border border-dashed px-4 py-4 ${
              isDark ? "border-sand-600" : "border-sand-300"
            }`}
          >
            <Text className={`text-sm text-center leading-5 ${textMuted(isDark)}`}>
              {t("home.filEmpty")}
            </Text>
          </Pressable>
        )}

        {!isWide ? (
          <View className="items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={t("home.openFil")}
                onPress={() => router.push(ROUTES.fil)}
                variant="secondary"
                align="stretch"
              />
            </View>
          </View>
        ) : null}

        <View className="flex-row justify-center gap-6 pt-2 pb-2 flex-wrap">
          <Pressable onPress={() => router.push(ROUTES.settings)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>{t("home.settingsLink")}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.changelog)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>{t("home.updatesLink")}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.privacy)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>{t("home.privacyLink")}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
