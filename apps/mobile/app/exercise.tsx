import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { DurationPicker } from "@/components/DurationPicker";
import { GentleTimer } from "@/components/GentleTimer";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { getTimerSound } from "@/lib/preferences";
import type { TimerSoundId } from "@/lib/sounds";
import { useRitualStore } from "@/lib/store";

export default function ExerciseScreen() {
  const { exercise, durationMinutes, impulse, setDurationMinutes } =
    useRitualStore();
  const [completionSound, setCompletionSound] = useState<TimerSoundId>("gong");

  useEffect(() => {
    getTimerSound().then(setCompletionSound);
  }, []);

  if (!exercise) {
    router.replace("/ritual");
    return null;
  }

  return (
    <ScreenContainer title="Votre exercice">
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
