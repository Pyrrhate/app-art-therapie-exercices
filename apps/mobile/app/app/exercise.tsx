import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
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
import { RitualDraftBanner } from "@/components/ritual/RitualDraftBanner";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { getTimerSound } from "@/lib/preferences";
import { persistRitualDraft } from "@/lib/ritualPersistence";
import type { TimerSoundId } from "@/lib/sounds";
import { useRitualStore } from "@/lib/store";

export default function ExerciseScreen() {
  const exercise = useRitualStore((s) => s.exercise);
  const durationMinutes = useRitualStore((s) => s.durationMinutes);
  const impulse = useRitualStore((s) => s.impulse);
  const technique = useRitualStore((s) => s.technique);
  const exerciseSource = useRitualStore((s) => s.exerciseSource);
  const exerciseKeywords = useRitualStore((s) => s.exerciseKeywords);
  const currentRound = useRitualStore((s) => s.currentRound);
  const isExerciseAugmented = useRitualStore((s) => s.isExerciseAugmented);
  const evolutionTriggers = useRitualStore((s) => s.evolutionTriggers);
  const setDurationMinutes = useRitualStore((s) => s.setDurationMinutes);
  const [completionSound, setCompletionSound] = useState<TimerSoundId>("gong");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getTimerSound().then(setCompletionSound);
  }, []);

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

  return (
    <ScreenContainer
      variant="focus"
      refreshable
      compactTop
      fixedHeader={<ScreenNavBar backLabel="← Rituel" />}
      stickyFooter={
        <PrimaryButton
          label="J'ai terminé — capturer mon œuvre"
          onPress={() => router.push(ROUTES.reflection)}
        />
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

      <RitualDraftBanner className="mb-3" />

      <RitualProgressBar current="exercise" />

      {currentRound === 2 && isExerciseAugmented && (
        <AugmentedExerciseBanner triggers={evolutionTriggers} />
      )}

      {exerciseSource === "fallback" && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-3 py-2 mb-3">
          <Text className="text-sage-700 text-xs leading-5">
            Mode local actif — exercice guidé hors ligne.
          </Text>
        </View>
      )}

      <ExerciseKeywordChips keywords={exerciseKeywords} technique={technique} />

      <ContentCard className="mb-4 px-4 py-3">
        <Text className="text-sand-500 text-xs uppercase tracking-wider mb-2">
          Impulsion · {impulse}
        </Text>
        <ScrollView
          style={{ maxHeight: 100 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <Text className="text-sand-700 text-sm leading-6">{exercise}</Text>
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
    </ScreenContainer>
  );
}
