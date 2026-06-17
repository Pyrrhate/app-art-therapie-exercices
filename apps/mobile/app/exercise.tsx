import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { DurationPicker } from "@/components/DurationPicker";
import { ExerciseKeywordChips } from "@/components/exercise/ExerciseKeywordChips";
import { GentleTimer } from "@/components/GentleTimer";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { getTimerSound } from "@/lib/preferences";
import { persistRitualDraft } from "@/lib/ritualPersistence";
import type { TimerSoundId } from "@/lib/sounds";
import { useRitualStore } from "@/lib/store";

export default function ExerciseScreen() {
  const exercise = useRitualStore((s) => s.exercise);
  const durationMinutes = useRitualStore((s) => s.durationMinutes);
  const impulse = useRitualStore((s) => s.impulse);
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
    <ScreenContainer title="Votre exercice" refreshable>
      <ScreenNavBar backLabel="← Rituel" />

      {exerciseSource === "fallback" && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-3 mb-4">
          <Text className="text-sage-700 text-xs leading-5">
            Mode local actif — exercice guidé hors ligne.
          </Text>
        </View>
      )}

      <ExerciseKeywordChips keywords={exerciseKeywords} />

      <View className="bg-white rounded-2xl border border-sand-200 px-5 py-6 mb-4">
        <Text className="text-sand-400 text-xs uppercase tracking-wider mb-3">
          Impulsion · {impulse}
        </Text>
        <Text className="text-sand-700 text-base leading-7">{exercise}</Text>
      </View>

      <Text className="text-sand-600 text-sm mb-3 font-medium">
        Durée du timer
      </Text>
      <DurationPicker
        selected={durationMinutes}
        onSelect={setDurationMinutes}
      />

      <Text className="text-sand-500 text-sm text-center mt-6 mb-2">
        Prenez votre temps — le cercle avance en douceur
      </Text>

      <GentleTimer
        key={`${durationMinutes}-${completionSound}`}
        durationMinutes={durationMinutes}
        completionSound={completionSound}
      />

      <View className="pt-6 pb-4">
        <PrimaryButton
          label="J'ai terminé — capturer mon œuvre"
          onPress={() => router.push("/reflection")}
        />
      </View>
    </ScreenContainer>
  );
}
