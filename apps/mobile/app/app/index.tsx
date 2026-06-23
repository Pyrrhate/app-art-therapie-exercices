import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ModuleCard } from "@/components/home/ModuleCard";
import { ModuleQuickTile } from "@/components/home/ModuleQuickTile";
import { AppHeader } from "@/components/ui/AppHeader";
import { PastekIcon } from "@/components/ui/ModuleIcon";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ModuleIconId } from "@/components/ui/ModuleIcon";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { getFilEntries } from "@/lib/fil/storage";
import { FIL_SOURCE_META, type FilEntry } from "@/lib/fil/types";
import { navigateHome } from "@/lib/navigation";
import { ROUTES, type ModuleAmorceRoute } from "@/lib/routes";
import { hydrateRitualFromDraft } from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { useRitualStore } from "@/lib/store";

type ModuleDef = {
  title: string;
  icon: ModuleIconId;
  description: string;
  route: ModuleAmorceRoute;
};

const MODULES: ModuleDef[] = [
  {
    title: "Ping-Pong créatif",
    icon: "ping-pong",
    description: "Amorce rapide — quelques mots, puis l'exercice.",
    route: ROUTES.pingPong,
  },
  {
    title: "Palette intérieure",
    icon: "color-journey",
    description: "Trois teintes sur la roue chromatique, puis créer.",
    route: ROUTES.colorJourney,
  },
  {
    title: "Explorateur émotionnel",
    icon: "emotion-explorer",
    description: "Quatre zones de ressenti, un mot précis, puis créer.",
    route: ROUTES.emotionExplorer,
  },
  {
    title: "Chercheur de Nuances",
    icon: "nuance-finder",
    description: "Puzzle couleur sans IA — se détendre avant de créer.",
    route: ROUTES.nuanceFinder,
  },
];

const WIDE_LAYOUT_MIN = 720;

export default function WelcomeScreen() {
  const isDark = useIsDark();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_MIN;
  const scrollRef = useRef<ScrollView>(null);
  const [tracesY, setTracesY] = useState(0);
  const [draft, setDraft] = useState<RitualDraft | null>(null);
  const [recentFil, setRecentFil] = useState<FilEntry[]>([]);

  const loadDraft = useCallback(async () => {
    setDraft(await getRitualDraft());
    const fil = await getFilEntries();
    setRecentFil(fil.slice(0, isWide ? 3 : 2));
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
    <ScreenContainer scrollable refreshable scrollRef={scrollRef} contentMaxWidth={920} compactTop>
      <AppHeader compact onNavigateTraces={scrollToTraces} />

      <PastekScreenHero
        label="Art Thérapie"
        title={isWide ? "Trouver une impulsion,\n" : "Impulsion & "}
        accent={isWide ? "puis créer" : "création"}
        description={
          isWide
            ? "Un parcours guidé pour amorcer votre créativité, mener un exercice en douceur, puis garder trace de vos pratiques — le tout sur cet appareil."
            : undefined
        }
        onDescriptionPress={navigateHome}
        size={isWide ? "lg" : "md"}
        className={isWide ? "mb-6" : "mb-4"}
      />

      {draft && (
        <AccentCard className={`gap-2 ${isWide ? "mb-6" : "mb-3"}`}>
          <Text className="text-sage-600 font-medium text-sm">
            Reprendre votre rituel
          </Text>
          <Text
            className={`text-sm leading-5 ${textSecondary(isDark)}`}
            numberOfLines={isWide ? undefined : 2}
          >
            {draft.impulse} · {getTechniqueLabel(draft.technique)}
          </Text>
          {!isWide ? null : (
            <Text className={`text-xs ${textMuted(isDark)}`}>
              {draft.step === "reflection"
                ? "Étape : capture & réflexion"
                : "Étape : exercice en cours"}
            </Text>
          )}
          <View className={isWide ? "gap-3" : "flex-row gap-2 mt-1"}>
            <View className={isWide ? undefined : { flex: 1 }}>
              <PrimaryButton
                label="Continuer"
                onPress={handleContinueDraft}
                align="stretch"
              />
            </View>
            <View className={isWide ? undefined : { flex: 1 }}>
              <PrimaryButton
                label="Abandonner"
                onPress={handleDismissDraft}
                variant="ghost"
                align="stretch"
              />
            </View>
          </View>
        </AccentCard>
      )}

      <View className="gap-3">
        <PrimaryButton
          label="Commencer un exercice"
          onPress={() => router.push(ROUTES.ritual)}
          showArrow
          align="stretch"
        />
        <PrimaryButton
          label="Mode Sur-Mesure"
          onPress={() => router.push(ROUTES.custom)}
          variant="secondary"
          align="stretch"
        />
      </View>

      <View className={isWide ? "mt-8 mb-2" : "mt-5 mb-1"}>
        {isWide ? (
          <SectionHeader
            label="Amorces créatives"
            title="Des parcours légers pour faire émerger "
            accent="une impulsion"
            titleEnd=" avant l'acte."
          />
        ) : (
          <Text
            className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${textMuted(isDark)}`}
          >
            Amorces créatives
          </Text>
        )}

        <View className="flex-row flex-wrap gap-2.5 items-stretch">
          {MODULES.map((mod) =>
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
            label="Vos traces"
            title="Le Fil créatif — "
            accent="mémoire automatique"
            titleEnd=" de vos pratiques sur cet appareil."
          />
        ) : (
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-xs uppercase tracking-[0.18em] font-medium ${textMuted(isDark)}`}>
              Fil créatif
            </Text>
            <Pressable onPress={() => router.push(ROUTES.fil)} hitSlop={8}>
              <Text className="text-sage-500 text-sm font-medium">Tout voir →</Text>
            </Pressable>
          </View>
        )}

        {isWide ? (
          <PrimaryButton
            label="Ouvrir le Fil créatif"
            onPress={() => router.push(ROUTES.fil)}
            align="stretch"
          />
        ) : null}

        {recentFil.length > 0 ? (
          <View className="gap-2">
            {recentFil.map((entry) => {
              const meta = FIL_SOURCE_META[entry.source];
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push(`/fil/${entry.id}`)}
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
                      {formatSessionDate(entry.createdAt)} · {meta.label}
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
              Vos rituels et amorces laissent une trace ici, automatiquement.
            </Text>
          </Pressable>
        )}

        <View className="flex-row justify-center gap-8 pt-2 pb-2">
          <Pressable onPress={() => router.push(ROUTES.settings)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Paramètres</Text>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.privacy)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Confidentialité</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
