import { Text, View } from "react-native";
import { router } from "expo-router";
import { GentleTimer } from "@/components/GentleTimer";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { useRitualStore } from "@/lib/store";

export default function ExerciseScreen() {
  const { exercise, durationMinutes, impulse } = useRitualStore();

  if (!exercise) {
    router.replace("/");
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

      <Text className="text-sand-500 text-sm text-center mb-2">
        Prenez votre temps — le cercle avance en douceur
      </Text>

      <GentleTimer durationMinutes={durationMinutes} />

      <View className="mt-auto pt-4">
        <PrimaryButton
          label="J'ai terminé — capturer mon œuvre"
          onPress={() => router.push("/reflection")}
        />
      </View>
    </ScreenContainer>
  );
}
