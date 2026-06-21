import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { deleteFilEntry, getFilEntryById } from "@/lib/fil/storage";
import {
  FIL_SOURCE_META,
  isRitualFilEntry,
  type FilEntry,
} from "@/lib/fil/types";
import { startExerciseFromImpulse } from "@/lib/fil/bridges";
import { showAlert } from "@/lib/alert";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import { exportFilRitualPdf } from "@/lib/sessionExport";
import { useRitualStore } from "@/lib/store";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function FilDetailScreen() {
  const isDark = useIsDark();
  const { id } = useLocalSearchParams<{ id: string }>();
  const restoreFromFilEntry = useRitualStore((s) => s.restoreFromFilEntry);
  const [entry, setEntry] = useState<FilEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setEntry(await getFilEntryById(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleRedoExercise() {
    if (!entry || !isRitualFilEntry(entry)) return;
    restoreFromFilEntry(entry);
    router.push("/exercise");
  }

  async function handleRedoFromAmorce() {
    const m = entry?.metadata;
    if (!m?.impulse || !m.technique) return;
    try {
      await startExerciseFromImpulse(m.impulse, m.technique);
    } catch (error) {
      showAlert(
        "Impossible de continuer",
        error instanceof Error ? error.message : "Réessayez dans un instant."
      );
    }
  }

  function handleDelete() {
    if (!entry) return;
    const remove = async () => {
      await deleteFilEntry(entry.id);
      router.back();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Supprimer cette trace ?")) void remove();
      return;
    }
    Alert.alert("Supprimer cette trace ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void remove() },
    ]);
  }

  async function handleExportPdf() {
    if (!entry) return;
    setExporting(true);
    try {
      const result = await exportFilRitualPdf(entry);
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
        <ScreenNavBar backLabel="← Fil" />
        <ActivityIndicator color="#6B8F71" className="mt-12" />
      </ScreenContainer>
    );
  }

  if (!entry) {
    return (
      <ScreenContainer scrollable>
        <ScreenNavBar backLabel="← Fil" />
        <Text className={`mt-8 ${textMuted(isDark)}`}>Trace introuvable.</Text>
      </ScreenContainer>
    );
  }

  const meta = FIL_SOURCE_META[entry.source];
  const ritual = isRitualFilEntry(entry);
  const m = entry.metadata;
  const exercise = m?.exercise ? sanitizeAiDisplayText(m.exercise) : "";
  const reflection = m?.reflection
    ? sanitizeAiDisplayText(m.reflection)
    : entry.detail ?? "";
  const paragraphs = reflection.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <ScreenContainer scrollable>
      <ScreenNavBar backLabel="← Fil" />

      <PastekScreenHero
        label={`${meta.emoji} ${meta.label}`}
        title={entry.summary}
        description={formatSessionDate(entry.createdAt)}
        centered={false}
        size="md"
        className="mb-6"
      />

      {m?.photoUri ? (
        <Image
          source={{ uri: m.photoUri }}
          className="w-full h-56 rounded-3xl bg-sand-100 mb-6"
          resizeMode="cover"
        />
      ) : null}

      {m?.technique ? (
        <Text className={`text-sm mb-4 ${textSecondary(isDark)}`}>
          {getTechniqueLabel(m.technique)}
          {m.durationMinutes ? ` · ${m.durationMinutes} min` : ""}
        </Text>
      ) : null}

      {exercise ? (
        <View className={`rounded-3xl border px-5 py-5 mb-4 ${panelBg(isDark)}`}>
          <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
            Exercice
          </Text>
          <Text className={`text-base leading-7 ${textPrimary(isDark)}`}>
            {exercise}
          </Text>
        </View>
      ) : entry.detail && !ritual ? (
        <View className={`rounded-3xl border px-5 py-5 mb-4 ${panelBg(isDark)}`}>
          <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
            {entry.detail}
          </Text>
        </View>
      ) : null}

      {paragraphs.length > 0 && ritual && (
        <View className={`rounded-3xl border px-5 py-5 mb-4 ${panelBg(isDark)}`}>
          <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
            Miroir créatif
          </Text>
          {paragraphs.map((p, i) => (
            <Text
              key={i}
              className={`text-base leading-7 mb-4 italic ${textSecondary(isDark)}`}
            >
              {p}
            </Text>
          ))}
        </View>
      )}

      {m?.openQuestions?.length ? (
        <View className="bg-sage-50 rounded-3xl border border-sage-100 px-5 py-5 mb-6">
          {m.openQuestions.map((q, i) => (
            <Text key={i} className="text-sand-600 text-sm leading-6 mb-2">
              · {sanitizeAiDisplayText(q)}
            </Text>
          ))}
        </View>
      ) : null}

      {m?.colors?.length ? (
        <View className="flex-row flex-wrap gap-2 mb-6">
          {m.colors.map((hex) => (
            <View
              key={hex}
              className={`w-8 h-8 rounded-full border ${isDark ? "border-sand-600" : "border-sand-200"}`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </View>
      ) : null}

      <View className="gap-3 pb-4">
        {ritual && (
          <PrimaryButton
            label="Refaire cet exercice"
            onPress={handleRedoExercise}
          />
        )}
        {!ritual && m?.impulse && m.technique && (
          <PrimaryButton
            label="Passer à l'exercice"
            onPress={() => void handleRedoFromAmorce()}
          />
        )}
        {ritual && (
          <PrimaryButton
            label={exporting ? "Export…" : "Exporter en PDF (impression)"}
            onPress={handleExportPdf}
            variant="secondary"
            disabled={exporting}
          />
        )}
        <PrimaryButton
          label="Supprimer"
          onPress={handleDelete}
          variant="ghost"
        />
      </View>
    </ScreenContainer>
  );
}
