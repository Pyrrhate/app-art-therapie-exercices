import { useCallback, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { getTechniqueLabel } from "@/constants";
import {
  hydrateRitualFromDraft,
} from "@/lib/ritualPersistence";
import { getRitualDraft, type RitualDraft } from "@/lib/ritualDraft";
import { useRitualStore } from "@/lib/store";

const MODULES = [
  {
    title: "Rituel créatif",
    emoji: "✨",
    description: "Impulsion, exercice guidé, miroir bienveillant (connexion IA).",
    route: "/ritual" as const,
  },
  {
    title: "Studio Mandala",
    emoji: "🪷",
    description: "Coloriage procédural à votre rythme.",
    route: "/mandala" as const,
  },
  {
    title: "Ping-Pong créatif",
    emoji: "🏓",
    description: "Chaîne de mots pour amorcer une impulsion.",
    route: "/ping-pong" as const,
  },
  {
    title: "Chercheur de Nuances",
    emoji: "🎨",
    description: "Puzzle chromatique sans score ni chrono.",
    route: "/nuance-finder" as const,
  },
];

export default function WelcomeScreen() {
  const [draft, setDraft] = useState<RitualDraft | null>(null);

  const loadDraft = useCallback(async () => {
    setDraft(await getRitualDraft());
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
            Un rituel créatif,{"\n"}en douceur
          </Text>
          <Text className="text-base text-sand-500 leading-7 mb-4">
            Parcours guidé par l&apos;IA, modules pour vous détendre, sessions
            sauvegardées localement sur cet appareil.
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

          {draft && (
            <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-5 mb-4">
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

          <Text className="text-sand-700 font-medium mb-3">Au programme</Text>
          <View className="gap-3 mb-6">
            {MODULES.map((mod) => (
              <Pressable
                key={mod.route}
                onPress={() => router.push(mod.route)}
                className="bg-white rounded-2xl border border-sand-200 px-5 py-4 active:border-sage-400"
              >
                <Text className="text-xl mb-1">{mod.emoji}</Text>
                <Text className="text-sand-800 font-medium text-base mb-1">
                  {mod.title}
                </Text>
                <Text className="text-sand-500 text-sm leading-5">
                  {mod.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-4 pt-2">
          <PrimaryButton
            label="Commencer un rituel"
            onPress={() => router.push("/ritual")}
          />
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
