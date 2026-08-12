import { useCallback, useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  ARTISTIC_TECHNIQUES,
  TECHNIQUE_LABELS,
  isAiAnalysisSupported,
  type ArtisticTechnique,
} from "@art-therapie/shared";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  addCustomTechnique,
  deleteCustomTechnique,
  getManagedTechniquesState,
  setBuiltinTechniqueEnabled,
  setCustomTechniqueEnabled,
  type CustomTechnique,
  type ManagedTechniquesState,
} from "@/lib/techniques/managed";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function TechniquesSettingsScreen() {
  const isDark = useIsDark();
  const [state, setState] = useState<ManagedTechniquesState | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [mapsTo, setMapsTo] = useState<ArtisticTechnique>("mixed_media");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    void getManagedTechniquesState().then(setState);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function toggleBuiltin(id: ArtisticTechnique, enabled: boolean) {
    setBusy(true);
    try {
      setState(await setBuiltinTechniqueEnabled(id, enabled));
    } finally {
      setBusy(false);
    }
  }

  async function toggleCustom(tech: CustomTechnique, enabled: boolean) {
    setBusy(true);
    try {
      setState(await setCustomTechniqueEnabled(tech.id, enabled));
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    if (newLabel.trim().length < 2) {
      showAlert("Technique", "Indiquez un nom d'au moins 2 caractères.");
      return;
    }
    setBusy(true);
    try {
      setState(
        await addCustomTechnique({
          label: newLabel,
          mapsTo,
          aiAnalysis: isAiAnalysisSupported(mapsTo),
        })
      );
      setNewLabel("");
    } catch (error) {
      showAlert(
        "Technique",
        error instanceof Error ? error.message : "Ajout impossible."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(tech: CustomTechnique) {
    setBusy(true);
    try {
      setState(await deleteCustomTechnique(tech.id));
    } catch (error) {
      showAlert(
        "Technique",
        error instanceof Error ? error.message : "Suppression impossible."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <ScreenContainer compactTop>
        <ScreenNavBar backLabel="← Réglages" />
        <Text className={textSecondary(isDark)}>Chargement…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar backLabel="← Réglages" />
      <PastekScreenHero
        label="Techniques"
        title="Gérer vos "
        accent="techniques"
        description="Désactivez celles que vous n'utilisez pas. Les techniques intégrées ne sont pas supprimables. Ajoutez les vôtres librement."
        className="mb-6"
      />

      <Text className={`text-sm font-medium mb-3 ${textPrimary(isDark)}`}>
        Techniques intégrées
      </Text>
      <View className="gap-2 mb-8">
        {ARTISTIC_TECHNIQUES.map((id) => {
          const enabled = !state.disabledBuiltin.includes(id);
          return (
            <View
              key={id}
              className={`rounded-2xl border px-4 py-3 flex-row items-center justify-between ${panelBg(isDark)}`}
            >
              <View className="flex-1 pr-3">
                <Text className={`font-medium ${textPrimary(isDark)}`}>
                  {TECHNIQUE_LABELS[id]}
                </Text>
                <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`}>
                  {isAiAnalysisSupported(id)
                    ? "Analyse visuelle possible"
                    : "Analyse via ressenti / clé IA"}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => void toggleBuiltin(id, v)}
                disabled={busy}
              />
            </View>
          );
        })}
      </View>

      <Text className={`text-sm font-medium mb-3 ${textPrimary(isDark)}`}>
        Techniques personnelles
      </Text>
      {state.custom.length === 0 ? (
        <Text className={`text-sm mb-4 ${textSecondary(isDark)}`}>
          Aucune technique perso pour l&apos;instant.
        </Text>
      ) : (
        <View className="gap-2 mb-4">
          {state.custom.map((tech) => (
            <View
              key={tech.id}
              className={`rounded-2xl border px-4 py-3 ${panelBg(isDark)}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1 pr-3">
                  <Text className={`font-medium ${textPrimary(isDark)}`}>
                    {tech.label}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`}>
                    Basée sur {TECHNIQUE_LABELS[tech.mapsTo]}
                  </Text>
                </View>
                <Switch
                  value={tech.enabled}
                  onValueChange={(v) => void toggleCustom(tech, v)}
                  disabled={busy}
                />
              </View>
              <Pressable onPress={() => void handleDelete(tech)} disabled={busy}>
                <Text className="text-red-500 text-xs font-medium">
                  Supprimer
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className={`rounded-2xl border px-4 py-4 gap-3 mb-8 ${panelBg(isDark)}`}>
        <Text className={`font-medium ${textPrimary(isDark)}`}>
          Ajouter une technique
        </Text>
        <TextInput
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder="Ex. Aquarelle botanique"
          placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
          className={`border rounded-xl px-3 py-2 ${
            isDark
              ? "border-sand-600 bg-sand-800 text-sand-100"
              : "border-sand-200 bg-white text-sand-800"
          }`}
        />
        <Text className={`text-xs ${textMuted(isDark)}`}>
          Technique de base pour l&apos;IA : {TECHNIQUE_LABELS[mapsTo]}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(["painting", "drawing", "writing", "mixed_media", "music", "video"] as ArtisticTechnique[]).map(
            (id) => (
              <Pressable
                key={id}
                onPress={() => setMapsTo(id)}
                className={`rounded-full px-3 py-1.5 border ${
                  mapsTo === id
                    ? "bg-sage-500 border-sage-500"
                    : isDark
                      ? "border-sand-600"
                      : "border-sand-200"
                }`}
              >
                <Text
                  className={`text-xs ${
                    mapsTo === id ? "text-white" : textPrimary(isDark)
                  }`}
                >
                  {TECHNIQUE_LABELS[id]}
                </Text>
              </Pressable>
            )
          )}
        </View>
        <PrimaryButton
          label={busy ? "Ajout…" : "Ajouter"}
          onPress={() => void handleAdd()}
          disabled={busy}
        />
      </View>
    </ScreenContainer>
  );
}
