import { useEffect, useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { router } from "expo-router";
import { ROUTES } from "@/lib/routes";
import { DurationPicker } from "@/components/DurationPicker";
import { ExerciseKeywordChips } from "@/components/exercise/ExerciseKeywordChips";
import { GentleTimer } from "@/components/GentleTimer";
import { AugmentedExerciseBanner } from "@/components/experience";
import { ContentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { RitualProgressBar } from "@/components/ui/RitualProgressBar";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { resolveByokCredentials } from "@/lib/aiKeys";
import { localExerciseBannerMessage } from "@/lib/localExerciseBanner";
import { getTimerSound } from "@/lib/preferences";
import { persistRitualDraft } from "@/lib/ritualPersistence";
import type { TimerSoundId } from "@/lib/sounds";
import { useRitualStore } from "@/lib/store";

export default function ExerciseScreen() {
  const exercise = useRitualStore((s) => s.exercise);
  const exerciseDevelopment = useRitualStore((s) => s.exerciseDevelopment);
  const moduleStatement = useRitualStore((s) => s.moduleStatement);
  const durationMinutes = useRitualStore((s) => s.durationMinutes);
  const impulse = useRitualStore((s) => s.impulse);
  const technique = useRitualStore((s) => s.technique);
  const exerciseSource = useRitualStore((s) => s.exerciseSource);
  const exerciseFallbackNote = useRitualStore((s) => s.exerciseFallbackNote);
  const exerciseKeywords = useRitualStore((s) => s.exerciseKeywords);
  const currentRound = useRitualStore((s) => s.currentRound);
  const isExerciseAugmented = useRitualStore((s) => s.isExerciseAugmented);
  const evolutionTriggers = useRitualStore((s) => s.evolutionTriggers);
  const setDurationMinutes = useRitualStore((s) => s.setDurationMinutes);
  const [completionSound, setCompletionSound] = useState<TimerSoundId>("gong");
  const [ready, setReady] = useState(false);
  const [byokConfigured, setByokConfigured] = useState(false);
  const [silenceMode, setSilenceMode] = useState(false);
  const [peekConsigne, setPeekConsigne] = useState(false);

  useEffect(() => {
    getTimerSound().then(setCompletionSound);
  }, []);

  useEffect(() => {
    if (exerciseSource !== "fallback") {
      setByokConfigured(false);
      return;
    }
    void resolveByokCredentials()
      .then((c) => setByokConfigured(Boolean(c)))
      .catch(() => setByokConfigured(false));
  }, [exerciseSource]);

  useEffect(() => {
    void persistRitualDraft("exercise");
  }, [exercise, durationMinutes, impulse]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const current = useRitualStore.getState().exercise?.trim();
      if (!current) {
        router.replace(ROUTES.ritual);
        return;
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [exercise]);

  if (!ready || !exercise?.trim()) {
    return null;
  }

  const fallbackBanner = localExerciseBannerMessage({
    fallbackNote: exerciseFallbackNote,
    byokConfigured,
  });

  const keywordPreview =
    exerciseKeywords.length > 0
      ? exerciseKeywords.slice(0, 4).join(" · ")
      : impulse;

  if (silenceMode) {
    return (
      <View className="flex-1 bg-[#1C1916] px-6 pt-14 pb-10 justify-between">
        <StatusBar barStyle="light-content" />
        <View className="items-center gap-3">
          <Text className="text-sand-400 text-xs uppercase tracking-[0.2em]">
            Silence créatif
          </Text>
          <Text className="text-sand-200 text-sm text-center leading-6 px-4">
            {keywordPreview}
          </Text>
          <Pressable
            onPress={() => setPeekConsigne((v) => !v)}
            className="rounded-full border border-sand-600/80 px-4 py-2"
            accessibilityRole="button"
            accessibilityLabel={
              peekConsigne ? "Masquer la consigne" : "Aperçu de la consigne"
            }
          >
            <Text className="text-sand-300 text-xs">
              {peekConsigne ? "Masquer la consigne" : "Aperçu consigne"}
            </Text>
          </Pressable>
          {peekConsigne ? (
            <ScrollView
              className="max-h-40 w-full rounded-2xl border border-sand-700 bg-sand-900/80 px-4 py-3"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-sand-300 text-sm leading-6">{exercise}</Text>
            </ScrollView>
          ) : null}
        </View>

        <GentleTimer
          durationMinutes={durationMinutes}
          completionSound={completionSound}
          silence
        />

        <View className="gap-3">
          <PrimaryButton
            label="J'ai terminé — capturer mon œuvre"
            onPress={() => {
              setPeekConsigne(false);
              setSilenceMode(false);
              router.push(ROUTES.reflection);
            }}
          />
          <PrimaryButton
            label="Quitter le silence"
            onPress={() => {
              setPeekConsigne(false);
              setSilenceMode(false);
            }}
            variant="ghost"
          />
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer
      variant="focus"
      refreshable
      compactTop
      fixedHeader={<ScreenNavBar backLabel="← Rituel" />}
      stickyFooter={
        <View className="gap-3">
          <PrimaryButton
            label="Mode silence — créer sans distraction"
            onPress={() => {
              setPeekConsigne(false);
              setSilenceMode(true);
            }}
            variant="secondary"
          />
          <PrimaryButton
            label="J'ai terminé — capturer mon œuvre"
            onPress={() => router.push(ROUTES.reflection)}
          />
        </View>
      }
    >
      <PastekScreenHero
        label="Exercice"
        title="Votre "
        accent="exercice"
        centered={false}
        size="md"
        className="mb-3"
      />

      <RitualProgressBar current="exercise" />

      {currentRound === 2 && isExerciseAugmented && (
        <AugmentedExerciseBanner triggers={evolutionTriggers} />
      )}

      {exerciseSource === "fallback" && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-3 py-2 mb-3">
          <Text className="text-sage-700 text-xs leading-5">
            {fallbackBanner}
          </Text>
        </View>
      )}

      <ExerciseKeywordChips keywords={exerciseKeywords} technique={technique} />

      <ContentCard className="mb-4 px-4 py-3">
        <Text className="text-sand-500 text-xs uppercase tracking-wider mb-2">
          Impulsion · {impulse}
        </Text>
        <ScrollView
          style={{ maxHeight: 220 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <Text className="text-sand-700 text-sm leading-6 mb-3">{exercise}</Text>
          {exerciseDevelopment?.trim() ? (
            <View className="mb-3">
              <Text className="text-sand-500 text-xs uppercase tracking-wider mb-1">
                Développer la consigne
              </Text>
              <Text className="text-sand-700 text-sm leading-6">
                {exerciseDevelopment}
              </Text>
            </View>
          ) : null}
          {moduleStatement?.trim() ? (
            <View className="pt-2 border-t border-sand-100">
              <Text className="text-sand-500 text-xs uppercase tracking-wider mb-1">
                Contexte du module
              </Text>
              <Text className="text-sand-600 text-sm leading-6">
                {moduleStatement}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </ContentCard>

      <Text className="text-sand-600 text-sm mb-2 font-medium">
        Durée du timer
      </Text>
      <DurationPicker
        selected={durationMinutes}
        onSelect={setDurationMinutes}
      />

      <GentleTimer
        durationMinutes={durationMinutes}
        completionSound={completionSound}
      />

      <Text className="text-sand-500 text-xs leading-5 text-center mt-2 mb-4 px-2">
        Le mode silence assombrit l&apos;écran et ne garde que le timer — idéal
        pour démarrer votre temps de création. Touchez « Consigne » pour un
        aperçu discret.
      </Text>
    </ScreenContainer>
  );
}
