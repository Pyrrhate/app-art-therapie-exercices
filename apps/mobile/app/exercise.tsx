import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { DurationPicker } from "@/components/DurationPicker";
import { ExerciseKeywordChips } from "@/components/exercise/ExerciseKeywordChips";
import { GentleTimer } from "@/components/GentleTimer";
import { ContentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { RitualProgressBar } from "@/components/ui/RitualProgressBar";
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
        router.replace("/ritual");
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
      heroLabel="Exercice"
      title="Votre "
      titleAccent="exercice"
      variant="focus"
      refreshable
      heroCentered={false}
      heroSize="md"
      stickyFooter={
        <PrimaryButton
          label="J'ai terminé — capturer mon œuvre"
          onPress={() => router.push("/reflection")}
        />
      }
    >
      <ScreenNavBar backLabel="← Rituel" />
      <RitualProgressBar current="exercise" />

      {exerciseSource === "fallback" && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-3 mb-4">
          <Text className="text-sage-700 text-xs leading-5">
            Mode local actif — exercice guidé hors ligne.
          </Text>
        </View>
      )}

      <ExerciseKeywordChips keywords={exerciseKeywords} technique={technique} />

      <ContentCard className="mb-6">
        <Text className="text-sand-500 text-xs uppercase tracking-wider mb-3">
          Impulsion · {impulse}
        </Text>
        <Text className="text-sand-700 text-base leading-7">{exercise}</Text>
      </ContentCard>

      <Text className="text-sand-600 text-sm mb-3 font-medium">
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
