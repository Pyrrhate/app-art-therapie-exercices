import { useCallback, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { AccentCard, ContentCard } from "@/components/ui/Card";
import { DisplayHero } from "@/components/ui/DisplayText";
import { ModuleIcon, type ModuleIconId } from "@/components/ui/ModuleIcon";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { getTechniqueLabel } from "@/constants";
import { getFilEntries } from "@/lib/fil/storage";
import { hydrateRitualFromDraft } from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { useRitualStore } from "@/lib/store";

type ModuleCard = {
  title: string;
  icon: ModuleIconId;
  description: string;
  route: "/ping-pong" | "/color-journey" | "/nuance-finder" | "/emotion-explorer";
};

const CREATIVITY_MODULES: ModuleCard[] = [
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

function ModuleCardItem({ mod }: { mod: ModuleCard }) {
  const card = (
    <ContentCard className="flex-1 min-h-[140px]">
      <ModuleIcon id={mod.icon} />
      <Text className="text-sand-800 font-medium text-base mb-1">
        {mod.title}
      </Text>
      <Text className="text-sand-600 text-sm leading-5">{mod.description}</Text>
    </ContentCard>
  );

  if (Platform.OS === "web") {
    return (
      <HoverScale
        onPress={() => router.push(mod.route)}
        hoverScale={1.02}
        style={{ flex: 1, minWidth: "46%", maxWidth: "50%" }}
        accessibilityRole="button"
        accessibilityLabel={mod.title}
      >
        {card}
      </HoverScale>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(mod.route)}
      className="flex-1"
      style={{ minWidth: "46%", maxWidth: "50%" }}
      accessibilityRole="button"
      accessibilityLabel={mod.title}
    >
      {card}
    </Pressable>
  );
}

export default function WelcomeScreen() {
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
    <ScreenContainer scrollable refreshable>
      <View className="gap-6 pb-4">
        <View>
          <Text className="text-sage-500 text-sm uppercase tracking-widest mb-4">
            Art Thérapie
          </Text>
          <DisplayHero className="mb-4">
            Trouver une impulsion,{"\n"}puis créer
          </DisplayHero>
          <Text className="text-base text-sand-600 leading-7 mb-6">
            Un parcours guidé pour amorcer votre créativité, mener un exercice
            en douceur, puis garder trace de vos pratiques — le tout sur cet
            appareil.
          </Text>

          <PrimaryButton
            label="Commencer un exercice"
            onPress={() => router.push("/ritual")}
          />

          {draft && (
            <AccentCard className="mt-4 gap-2">
              <Text className="text-sage-700 font-medium">
                Reprendre votre rituel
              </Text>
              <Text className="text-sand-600 text-sm leading-6">
                {draft.impulse} · {getTechniqueLabel(draft.technique)}
              </Text>
              <Text className="text-sand-500 text-xs">
                {draft.step === "reflection"
                  ? "Étape : capture & réflexion"
                  : "Étape : exercice en cours"}
              </Text>
              <PrimaryButton label="Continuer" onPress={handleContinueDraft} />
              <PrimaryButton
                label="Abandonner"
                onPress={handleDismissDraft}
                variant="ghost"
              />
            </AccentCard>
          )}
        </View>

        <View>
          <Text className="text-sand-700 font-medium mb-1">
            Amorces créatives
          </Text>
          <Text className="text-sand-600 text-sm leading-5 mb-4">
            Des parcours légers pour faire émerger une impulsion avant l&apos;acte.
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {CREATIVITY_MODULES.map((mod) => (
              <ModuleCardItem key={mod.route} mod={mod} />
            ))}
          </View>
        </View>

        <View className="border-t border-sand-200 pt-6 gap-4">
          <Text className="text-sand-700 font-medium">Vos traces</Text>
          <Text className="text-sand-600 text-sm leading-5 -mt-2">
            La mémoire de vos pratiques créatives, ici sur votre appareil.
          </Text>
          <PrimaryButton
            label="Fil créatif"
            onPress={() => router.push("/fil")}
            variant="secondary"
          />
          {lastFilSummary ? (
            <Pressable onPress={() => router.push("/fil")} className="px-1">
              <Text className="text-sand-500 text-xs text-center leading-5">
                Dernière trace : {lastFilSummary}
              </Text>
            </Pressable>
          ) : null}
          <PrimaryButton
            label="Mes exercices sauvegardés"
            onPress={() => router.push("/sessions")}
            variant="ghost"
          />
          <View className="flex-row justify-center gap-6 pt-2">
            <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
              <Text className="text-sand-500 text-sm">Paramètres</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/privacy")} hitSlop={8}>
              <Text className="text-sand-500 text-sm">Confidentialité</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
