import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { DurationPicker } from "@/components/DurationPicker";
import { AccentCard, ContentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { RitualProgressBar } from "@/components/ui/RitualProgressBar";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { TechniquePicker } from "@/components/TechniquePicker";
import { TECHNIQUES, isAiAnalysisSupported } from "@/constants";
import { ApiError, generateExercise } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { useRitualStore } from "@/lib/store";

export default function RitualScreen() {
  const {
    impulse,
    technique,
    durationMinutes,
    setImpulse,
    setTechnique,
    setDurationMinutes,
    setExercise,
  } = useRitualStore();
  const [impulsePrefilled] = useState(() => impulse.trim().length > 0);
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!impulse.trim() || !technique) return;

    setLoading(true);
    setError(null);
    setOfflineMode(false);
    try {
      const result = await generateExercise(
        impulse.trim(),
        technique,
        durationMinutes
      );
      setExercise(result.exercise, durationMinutes, result.source, result.keywords);
      if (result.source === "fallback") {
        setOfflineMode(true);
      }
      router.push("/exercise");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Une erreur inattendue est survenue. Réessayez dans un instant.";
      setError(message);
      showAlert("Impossible de continuer", message);
    } finally {
      setLoading(false);
    }
  }

  const canContinue = impulse.trim().length > 0 && technique !== null;

  const subtitle = impulsePrefilled
    ? "Choisissez votre technique et la durée, puis passez à l'exercice."
    : "Quel mot, idée ou couleur vous appelle aujourd'hui ? Choisissez ensuite votre technique et la durée, puis passez à l'exercice.";

  return (
    <ScreenContainer
      heroLabel="Rituel créatif"
      title="L'"
      titleAccent="Impulsion"
      subtitle={subtitle}
      refreshable
    >
      <ScreenNavBar backLabel="← Accueil" onBack={() => router.replace("/")} />
      <RitualProgressBar current="ritual" />

      {impulsePrefilled && (
        <AccentCard className="mb-6">
          <Text className="text-sage-700 text-sm leading-6">
            Votre impulsion est prête — choisissez technique et durée, puis
            passez à l&apos;exercice.
          </Text>
        </AccentCard>
      )}

      {offlineMode && (
        <Text className="text-amber-700 text-xs mb-3 leading-5">
          Mode local actif — exercice guidé hors ligne.
        </Text>
      )}

      <ContentCard className="mb-8 px-0 py-0 overflow-hidden">
        <TextInput
          value={impulse}
          onChangeText={setImpulse}
          placeholder="Une couleur, une affirmation, un thème…"
          placeholderTextColor="#B8A090"
          multiline
          accessibilityLabel="Votre impulsion créative"
          className="px-5 py-4 text-sand-800 text-base min-h-[100px]"
        />
      </ContentCard>

      <Text className="text-sand-600 text-sm mb-4 font-medium">
        Technique artistique
      </Text>
      <TechniquePicker
        selected={technique}
        onSelect={setTechnique}
        techniques={TECHNIQUES}
      />

      {technique && !isAiAnalysisSupported(technique) && (
        <Text className="text-amber-700 text-xs mt-3 mb-1 leading-5">
          Cette technique ne propose pas d&apos;analyse IA en phase réflexion —
          vous pourrez accueillir votre ressenti avec des questions
          bienveillantes, sans envoi d&apos;image au serveur.
        </Text>
      )}

      <Text className="text-sand-600 text-sm mb-4 mt-8 font-medium">
        Durée du rituel
      </Text>
      <DurationPicker
        selected={durationMinutes}
        onSelect={setDurationMinutes}
      />

      <View className="mt-auto pt-8 gap-4">
        {error && (
          <Text className="text-red-500 text-sm text-center leading-5 px-2">
            {error}
          </Text>
        )}
        <PrimaryButton
          label={loading ? "Préparation…" : "Passer à l'exercice"}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        />
        {loading && (
          <View className="mt-2 items-center">
            <ActivityIndicator color="#6B8F71" />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
