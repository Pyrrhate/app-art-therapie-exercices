import { useCallback, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { getTechniqueLabel } from "@/constants";
import { getFilEntries } from "@/lib/fil/storage";
import {
  hydrateRitualFromDraft,
} from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { useRitualStore } from "@/lib/store";

type ModuleCard = {
  title: string;
  emoji: string;
  description: string;
  route: "/ping-pong" | "/color-journey" | "/nuance-finder";
};

const CREATIVITY_MODULES: ModuleCard[] = [
  {
    title: "Ping-Pong créatif",
    emoji: "🏓",
    description:
      "Amorce rapide en 2–3 min — quelques mots pour l'impulsion, puis l'exercice.",
    route: "/ping-pong",
  },
  {
    title: "Palette intérieure",
    emoji: "🌈",
    description:
      "Trois teintes sur la roue chromatique — complémentaire et harmonie, puis l'exercice.",
    route: "/color-journey",
  },
];

const RELAX_MODULES: ModuleCard[] = [
  {
    title: "Chercheur de Nuances",
    emoji: "🎨",
    description:
      "Une autre façon d'aborder la couleur — puzzle 8×8 sans IA, puis créer.",
    route: "/nuance-finder",
  },
];

function ModuleCardItem({ mod }: { mod: ModuleCard }) {
  return (
    <Pressable
      onPress={() => router.push(mod.route)}
      className="bg-white rounded-2xl border border-sand-200 px-5 py-4 active:border-sage-400"
    >
      <Text className="text-xl mb-1">{mod.emoji}</Text>
      <Text className="text-sand-800 font-medium text-base mb-1">
        {mod.title}
      </Text>
      <Text className="text-sand-500 text-sm leading-5">{mod.description}</Text>
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
      <View className="gap-4 pb-4">
        <View>
          <Text className="text-sage-500 text-sm uppercase tracking-widest mb-4">
            Art Thérapie
          </Text>
          <Text className="text-4xl font-light text-sand-800 mb-4 leading-tight">
            Trouver une impulsion,{"\n"}puis créer
          </Text>
          <Text className="text-base text-sand-500 leading-7 mb-4">
            Un parcours guidé pour amorcer votre créativité, mener un exercice
            en douceur, puis garder trace de vos pratiques — le tout sur cet
            appareil.
          </Text>
          {Platform.OS === "web" ? (
            <Text className="text-sand-400 text-xs leading-5 mb-6">
              Sur navigateur : F5 ou Ctrl+R pour actualiser la page.
            </Text>
          ) : (
            <Text className="text-sand-400 text-xs leading-5 mb-6">
              Tirez vers le bas pour actualiser l&apos;écran.
            </Text>
          )}

          <PrimaryButton
            label="Commencer un exercice"
            onPress={() => router.push("/ritual")}
          />

          {draft && (
            <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-5 mt-4">
              <Text className="text-sage-700 font-medium mb-1">
                Reprendre votre rituel
              </Text>
              <Text className="text-sand-600 text-sm leading-6 mb-1">
                {draft.impulse} · {getTechniqueLabel(draft.technique)}
              </Text>
              <Text className="text-sand-500 text-xs mb-4">
                {draft.step === "reflection"
                  ? "Étape : capture & réflexion"
                  : "Étape : exercice en cours"}
              </Text>
              <View className="gap-2">
                <PrimaryButton
                  label="Continuer"
                  onPress={handleContinueDraft}
                />
                <PrimaryButton
                  label="Abandonner"
                  onPress={handleDismissDraft}
                  variant="ghost"
                />
              </View>
            </View>
          )}

          <Text className="text-sand-700 font-medium mb-3 mt-6">
            Amorcer votre créativité
          </Text>
          <Text className="text-sand-500 text-sm leading-5 mb-3">
            Des amorces légères pour faire émerger une impulsion avant de
            passer à l&apos;acte.
          </Text>
          <View className="gap-3 mb-6">
            {CREATIVITY_MODULES.map((mod) => (
              <ModuleCardItem key={mod.route} mod={mod} />
            ))}
          </View>

          <Text className="text-sand-700 font-medium mb-3">
            Se détendre d&apos;abord
          </Text>
          <Text className="text-sand-500 text-sm leading-5 mb-3">
            Une autre façon d&apos;aborder la couleur — sans IA, à votre rythme,
            avant de passer à l&apos;exercice.
          </Text>
          <View className="gap-3 mb-6">
            {RELAX_MODULES.map((mod) => (
              <ModuleCardItem key={mod.route} mod={mod} />
            ))}
          </View>
        </View>

        <View className="gap-4 pt-2">
          <Text className="text-sand-700 font-medium">Vos traces</Text>
          <Text className="text-sand-500 text-sm leading-5 -mt-2">
            La mémoire de vos pratiques créatives, ici sur votre appareil.
          </Text>
          <PrimaryButton
            label="Fil créatif — Vos traces créatives"
            onPress={() => router.push("/fil")}
            variant="secondary"
          />
          {lastFilSummary ? (
            <Pressable onPress={() => router.push("/fil")} className="px-1">
              <Text className="text-sand-400 text-xs text-center leading-5">
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
            <Pressable onPress={() => router.push("/settings")}>
              <Text className="text-sand-400 text-sm">Paramètres</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/privacy")}>
              <Text className="text-sand-400 text-sm">Confidentialité</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
