import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ModuleCard } from "@/components/home/ModuleCard";
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
import { hydrateRitualFromDraft } from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { useRitualStore } from "@/lib/store";

type ModuleDef = {
  title: string;
  icon: ModuleIconId;
  description: string;
  route: "/ping-pong" | "/color-journey" | "/nuance-finder" | "/emotion-explorer";
};

const MODULES: ModuleDef[] = [
  {
    title: "Ping-Pong créatif",
    icon: "ping-pong",
    description: "Amorce rapide — quelques mots, puis l'exercice.",
    route: "/ping-pong",
  },
  {
    title: "Palette intérieure",
    icon: "color-journey",
    description: "Trois teintes sur la roue chromatique, puis créer.",
    route: "/color-journey",
  },
  {
    title: "Explorateur émotionnel",
    icon: "emotion-explorer",
    description: "Quatre zones de ressenti, un mot précis, puis créer.",
    route: "/emotion-explorer",
  },
  {
    title: "Chercheur de Nuances",
    icon: "nuance-finder",
    description: "Puzzle couleur sans IA — se détendre avant de créer.",
    route: "/nuance-finder",
  },
];

export default function WelcomeScreen() {
  const isDark = useIsDark();
  const scrollRef = useRef<ScrollView>(null);
  const [amorcesY, setAmorcesY] = useState(0);
  const [tracesY, setTracesY] = useState(0);
  const [draft, setDraft] = useState<RitualDraft | null>(null);
  const [recentFil, setRecentFil] = useState<FilEntry[]>([]);

  const loadDraft = useCallback(async () => {
    setDraft(await getRitualDraft());
    const fil = await getFilEntries();
    setRecentFil(fil.slice(0, 3));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDraft();
    }, [loadDraft])
  );

  function scrollTo(y: number) {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  }

  function handleContinueDraft() {
    if (!draft) return;
    hydrateRitualFromDraft(draft);
    router.push(draft.step === "reflection" ? "/reflection" : "/exercise");
  }

  function handleDismissDraft() {
    useRitualStore.getState().reset();
    setDraft(null);
  }

  return (
    <ScreenContainer scrollable refreshable scrollRef={scrollRef} contentMaxWidth={920}>
      <AppHeader
        onNavigateAmorces={() => scrollTo(amorcesY)}
        onNavigateTraces={() => scrollTo(tracesY)}
      />

      <PastekScreenHero
        label="Art Thérapie"
        title={"Trouver une impulsion,\n"}
        accent="puis créer"
        description="Un parcours guidé pour amorcer votre créativité, mener un exercice en douceur, puis garder trace de vos pratiques — le tout sur cet appareil."
        className="mb-8"
      />

      <PrimaryButton
        label="Commencer un exercice"
        onPress={() => router.push("/ritual")}
        showArrow
        align="center"
      />

      <View className="mb-16" />

      {draft && (
        <AccentCard className="mb-12 gap-2">
          <Text className="text-sage-600 font-medium">Reprendre votre rituel</Text>
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
            {draft.impulse} · {getTechniqueLabel(draft.technique)}
          </Text>
          <Text className={`text-xs ${textMuted(isDark)}`}>
            {draft.step === "reflection"
              ? "Étape : capture & réflexion"
              : "Étape : exercice en cours"}
          </Text>
          <PrimaryButton label="Continuer" onPress={handleContinueDraft} align="stretch" />
          <PrimaryButton
            label="Abandonner"
            onPress={handleDismissDraft}
            variant="ghost"
            align="stretch"
          />
        </AccentCard>
      )}

      <View onLayout={(e) => setAmorcesY(e.nativeEvent.layout.y)}>
        <SectionHeader
          label="Amorces créatives"
          title="Des parcours légers pour faire émerger "
          accent="une impulsion"
          titleEnd=" avant l'acte."
        />
        <View className="flex-row flex-wrap gap-4 mb-4">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.route} {...mod} />
          ))}
        </View>
      </View>

      <View
        className={`border-t pt-12 mt-8 gap-6 ${isDark ? "border-sand-700" : "border-sand-200"}`}
        onLayout={(e) => setTracesY(e.nativeEvent.layout.y)}
      >
        <SectionHeader
          label="Vos traces"
          title="Le Fil créatif — "
          accent="mémoire automatique"
          titleEnd=" de vos pratiques sur cet appareil."
        />

        <PrimaryButton
          label="Ouvrir le Fil créatif"
          onPress={() => router.push("/fil")}
          align="stretch"
        />

        {recentFil.length > 0 ? (
          <View className="gap-2 mt-2">
            {recentFil.map((entry) => {
              const meta = FIL_SOURCE_META[entry.source];
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push(`/fil/${entry.id}`)}
                  className={`rounded-2xl border px-4 py-3 flex-row items-start gap-3 ${
                    isDark ? "border-sand-700 bg-sand-800/50" : "border-sand-200 bg-white/80"
                  }`}
                >
                  <PastekIcon
                    id={meta.icon}
                    boxSize={36}
                    size={24}
                    className="mb-0 mt-0.5"
                  />
                  <View className="flex-1">
                    <Text className={`text-xs mb-1 ${textMuted(isDark)}`}>
                      {formatSessionDate(entry.createdAt)} · {meta.label}
                    </Text>
                    <Text
                      className={`text-sm font-medium ${textSecondary(isDark)}`}
                      numberOfLines={2}
                    >
                      {entry.summary}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text className={`text-sm text-center leading-6 px-2 ${textMuted(isDark)}`}>
            Chaque rituel et chaque amorce laissent une trace ici, sans action de votre part.
          </Text>
        )}

        <View className="flex-row justify-center gap-8 pt-4 pb-2">
          <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Paramètres</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/privacy")} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>Confidentialité</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
