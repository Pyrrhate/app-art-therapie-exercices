import { useCallback, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  clearDeepQuestionsOverrides,
  DEFAULT_DEEP_QUESTIONS,
  DEEP_QUESTION_KEYS,
  getDeepQuestionsOverrides,
  resolveDeepQuestions,
  saveDeepQuestionsOverrides,
  type DeepQuestionKey,
  type DeepQuestionOverride,
  type DeepQuestionsOverrides,
} from "@/lib/deepQuestions";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function DeepQuestionsSettingsScreen() {
  const isDark = useIsDark();
  const [drafts, setDrafts] = useState<
    Record<DeepQuestionKey, DeepQuestionOverride>
  >(() => resolveDeepQuestions());
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void getDeepQuestionsOverrides().then((overrides) => {
        setDrafts(resolveDeepQuestions(overrides));
      });
    }, [])
  );

  function updateField(
    key: DeepQuestionKey,
    field: keyof DeepQuestionOverride,
    value: string
  ) {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const overrides: DeepQuestionsOverrides = {};
      for (const key of DEEP_QUESTION_KEYS) {
        const d = drafts[key];
        const def = DEFAULT_DEEP_QUESTIONS[key];
        if (
          d.label.trim() !== def.label ||
          d.placeholder.trim() !== def.placeholder
        ) {
          overrides[key] = {
            label: d.label.trim() || def.label,
            placeholder: d.placeholder.trim() || def.placeholder,
            accessibilityLabel:
              d.accessibilityLabel.trim() || d.placeholder.trim() || def.accessibilityLabel,
          };
        }
      }
      await saveDeepQuestionsOverrides(overrides);
      showAlert("Enregistré", "Les questions du parcours profond sont à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await clearDeepQuestionsOverrides();
    setDrafts(resolveDeepQuestions());
    showAlert("Réinitialisé", "Questions par défaut restaurées.");
  }

  const inputClass = `border rounded-xl px-3 py-2 text-base ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar backLabel="← Réglages" />
      <PastekScreenHero
        label="Parcours profond"
        title="Questions "
        accent="d'ancrage"
        description="Personnalisez les trois questions posées avant le miroir créatif en mode profond."
        className="mb-6"
      />

      <View className="gap-4 pb-8">
        {DEEP_QUESTION_KEYS.map((key, index) => (
          <View
            key={key}
            className={`rounded-2xl border px-4 py-4 gap-3 ${panelBg(isDark)}`}
          >
            <Text className={`text-xs uppercase tracking-wider ${textMuted(isDark)}`}>
              Question {index + 1}
            </Text>
            <View className="gap-1">
              <Text className={`text-sm ${textPrimary(isDark)}`}>Libellé</Text>
              <TextInput
                value={drafts[key].label}
                onChangeText={(v) => updateField(key, "label", v)}
                className={inputClass}
              />
            </View>
            <View className="gap-1">
              <Text className={`text-sm ${textPrimary(isDark)}`}>
                Texte d&apos;aide
              </Text>
              <TextInput
                value={drafts[key].placeholder}
                onChangeText={(v) => updateField(key, "placeholder", v)}
                multiline
                className={`${inputClass} min-h-[72px]`}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

        <PrimaryButton
          label={saving ? "Enregistrement…" : "Enregistrer"}
          onPress={() => void handleSave()}
          disabled={saving}
        />
        <PrimaryButton
          label="Restaurer les questions par défaut"
          onPress={() => void handleReset()}
          variant="ghost"
          disabled={saving}
        />
        <Text className={`text-xs leading-5 ${textSecondary(isDark)}`}>
          Ces textes restent uniquement sur cet appareil.
        </Text>
      </View>
    </ScreenContainer>
  );
}
