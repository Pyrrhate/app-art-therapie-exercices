import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { TechniquePicker } from "@/components/TechniquePicker";
import { TECHNIQUES } from "@/constants";
import { generateExercise } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { useRitualStore } from "@/lib/store";

export default function ImpulseScreen() {
  const { impulse, technique, setImpulse, setTechnique, setExercise } =
    useRitualStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!impulse.trim() || !technique) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateExercise(impulse.trim(), technique);
      setExercise(result.exercise, result.durationMinutes);
      router.push("/exercise");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez.";
      setError(message);
      showAlert("Connexion indisponible", message);
    } finally {
      setLoading(false);
    }
  }

  const canContinue = impulse.trim().length > 0 && technique !== null;

  return (
    <ScreenContainer
      title="L'Impulsion"
      subtitle="Quel mot, idée ou couleur vous appelle aujourd'hui ? Choisissez ensuite votre technique."
    >
      <TextInput
        value={impulse}
        onChangeText={setImpulse}
        placeholder="Une couleur, une affirmation, un thème..."
        placeholderTextColor="#B8A090"
        multiline
        className="bg-white border border-sand-200 rounded-2xl px-5 py-4 text-sand-800 text-base min-h-[100px] mb-8"
      />

      <Text className="text-sand-600 text-sm mb-4 font-medium">
        Technique artistique
      </Text>
      <TechniquePicker
        selected={technique}
        onSelect={setTechnique}
        techniques={TECHNIQUES}
      />

      <View className="mt-auto pt-8 gap-4">
        {error && (
          <Text className="text-red-500 text-sm text-center leading-5 px-2">
            {error}
          </Text>
        )}
        <PrimaryButton
          label={loading ? "Préparation..." : "Commencer le rituel"}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        />
          {loading && (
            <View className="mt-2 items-center">
              <ActivityIndicator color="#6B8F71" />
            </View>
          )}
        <Pressable onPress={() => router.push("/settings")} className="py-2">
          <Text className="text-sand-400 text-sm text-center">Paramètres</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
