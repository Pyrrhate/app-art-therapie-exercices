import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ModuleCard } from "@/components/home/ModuleCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ModuleIconId } from "@/components/ui/ModuleIcon";
import { getTechniqueLabel } from "@/constants";
import { getFilEntries } from "@/lib/fil/storage";
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
  const [lastFilSummary, setLastFilSummary] = useState<string | null>(null);

  const loadDraft = useCallback(async () => {
    setDraft(await getRitualDraft());
    const fil = await getFilEntries();
    setLastFilSummary(fil[0]?.summary ?? null);
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

      <View className="items-center mb-16 px-2">
        <Text className="text-sage-500 text-xs uppercase tracking-[0.2em] mb-6 font-medium">
          Art Thérapie
        </Text>
        <Text
          className={`font-display text-center text-4xl leading-[1.12] mb-6 ${isDark ? "text-sand-100" : "text-sand-900"}`}
          style={{ letterSpacing: -1, maxWidth: 640 }}
        >
          Trouver une impulsion,{"\n"}
          <Text className="text-sage-500 font-display">puis créer</Text>
        </Text>
        <Text
          className={`text-base text-center leading-7 mb-8 max-w-md ${textSecondary(isDark)}`}
        >
          Un parcours guidé pour amorcer votre créativité, mener un exercice en
          douceur, puis garder trace de vos pratiques — le tout sur cet appareil.
        </Text>

        <PrimaryButton
          label="Commencer un exercice"
          onPress={() => router.push("/ritual")}
          showArrow
          align="center"
        />
      </View>

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
          title="La mémoire de vos pratiques créatives"
          titleEnd=", ici sur votre appareil."
        />

        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 min-w-[200px]">
            <PrimaryButton
              label="Fil créatif"
              onPress={() => router.push("/fil")}
              align="stretch"
            />
          </View>
          <View className="flex-1 min-w-[200px]">
            <PrimaryButton
              label="Mes exercices sauvegardés"
              onPress={() => router.push("/sessions")}
              variant="ghost"
              align="stretch"
            />
          </View>
        </View>

        {lastFilSummary ? (
          <Pressable onPress={() => router.push("/fil")} className="px-1">
            <Text className={`text-xs text-center leading-5 ${textMuted(isDark)}`}>
              Dernière trace : {lastFilSummary}
            </Text>
          </Pressable>
        ) : null}

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
