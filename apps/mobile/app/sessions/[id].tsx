import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import { exportSessionPdf } from "@/lib/sessionExport";
import { deleteSession, getSessionById } from "@/lib/storage";
import { showAlert } from "@/lib/alert";
import { useRitualStore } from "@/lib/store";
import type { SavedSession } from "@/lib/types";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restoreFromSession = useRitualStore((s) => s.restoreFromSession);
  const [session, setSession] = useState<SavedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setSession(await getSessionById(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleRedoExercise() {
    if (!session) return;
    restoreFromSession(session);
    router.push("/exercise");
  }

  function handleDelete() {
    if (!session) return;
    const remove = async () => {
      await deleteSession(session.id);
      router.back();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Supprimer cet exercice ?")) void remove();
      return;
    }
    Alert.alert("Supprimer cet exercice ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void remove() },
    ]);
  }

  async function handleExportPdf() {
    if (!session) return;
    setExporting(true);
    try {
      const result = await exportSessionPdf(session);
      showAlert("Export", result.message);
    } catch (error) {
      showAlert(
        "Export impossible",
        error instanceof Error ? error.message : "Réessayez dans un instant."
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <ScreenNavBar />
        <ActivityIndicator color="#6B8F71" className="mt-12" />
      </ScreenContainer>
    );
  }

  if (!session) {
    return (
      <ScreenContainer scrollable>
        <ScreenNavBar />
        <Text className="text-sand-500 mt-8">Exercice introuvable.</Text>
      </ScreenContainer>
    );
  }

  const exercise = sanitizeAiDisplayText(session.exercise);
  const reflection = session.reflection
    ? sanitizeAiDisplayText(session.reflection)
    : "";
  const paragraphs = reflection.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <ScreenContainer scrollable={false}>
      <ScreenNavBar backLabel="← Liste" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator
      >
        <Text className="text-sand-400 text-xs mb-2">
          {formatSessionDate(session.createdAt)}
        </Text>
        <Text className="text-3xl font-light text-sand-800 mb-2">
          {session.impulse}
        </Text>
        <Text className="text-sand-500 text-sm mb-6">
          {getTechniqueLabel(session.technique)} · {session.durationMinutes} min
        </Text>

        {session.photoUri ? (
          <Image
            source={{ uri: session.photoUri }}
            className="w-full h-56 rounded-2xl bg-sand-100 mb-6"
            resizeMode="cover"
          />
        ) : null}

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-4">
          <Text className="text-sand-700 text-xs uppercase tracking-wider mb-3">
            Exercice
          </Text>
          <Text className="text-sand-700 text-base leading-7">{exercise}</Text>
        </View>

        {paragraphs.length > 0 && (
          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-4">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
              Miroir créatif
            </Text>
            {paragraphs.map((p, i) => (
              <Text
                key={i}
                className="text-sage-700 text-base leading-7 mb-4 italic"
              >
                {p}
              </Text>
            ))}
          </View>
        )}

        {session.openQuestions?.length ? (
          <View className="bg-sage-50 rounded-2xl border border-sage-100 px-5 py-5 mb-6">
            {session.openQuestions.map((q, i) => (
              <Text key={i} className="text-sand-600 text-sm leading-6 mb-2">
                · {sanitizeAiDisplayText(q)}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="gap-3">
          <PrimaryButton
            label="Refaire cet exercice"
            onPress={handleRedoExercise}
          />
          <PrimaryButton
            label={exporting ? "Export…" : "Exporter en PDF (impression)"}
            onPress={handleExportPdf}
            variant="secondary"
            disabled={exporting}
          />
          <PrimaryButton
            label="Supprimer"
            onPress={handleDelete}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
