import { useCallback, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  clearDeepQuestionsOverrides,
  getDefaultDeepQuestions,
  DEEP_QUESTION_KEYS,
  getDeepQuestionsOverrides,
  resolveDeepQuestions,
  saveDeepQuestionsOverrides,
  type DeepQuestionKey,
  type DeepQuestionOverride,
  type DeepQuestionsOverrides,
} from "@/lib/deepQuestions";
import {
  clearSecondRoundQuestionsOverrides,
  getDefaultSecondRoundQuestions,
  getSecondRoundQuestionsOverrides,
  resolveSecondRoundQuestions,
  saveSecondRoundQuestionsOverrides,
  SECOND_ROUND_QUESTION_KEYS,
  type SecondRoundQuestionKey,
  type SecondRoundQuestionOverride,
  type SecondRoundQuestionsOverrides,
} from "@/lib/secondRoundQuestions";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function DeepQuestionsSettingsScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const [deepDrafts, setDeepDrafts] = useState<
    Record<DeepQuestionKey, DeepQuestionOverride>
  >(() => resolveDeepQuestions());
  const [roundDrafts, setRoundDrafts] = useState<
    Record<SecondRoundQuestionKey, SecondRoundQuestionOverride>
  >(() => resolveSecondRoundQuestions());
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        getDeepQuestionsOverrides(),
        getSecondRoundQuestionsOverrides(),
      ]).then(([deepOverrides, roundOverrides]) => {
        setDeepDrafts(resolveDeepQuestions(deepOverrides));
        setRoundDrafts(resolveSecondRoundQuestions(roundOverrides));
      });
    }, [])
  );

  function updateDeepField(
    key: DeepQuestionKey,
    field: keyof DeepQuestionOverride,
    value: string
  ) {
    setDeepDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  function updateRoundField(
    key: SecondRoundQuestionKey,
    field: keyof SecondRoundQuestionOverride,
    value: string
  ) {
    setRoundDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const deepOverrides: DeepQuestionsOverrides = {};
      const deepDefaults = getDefaultDeepQuestions();
      for (const key of DEEP_QUESTION_KEYS) {
        const d = deepDrafts[key];
        const def = deepDefaults[key];
        if (
          d.label.trim() !== def.label ||
          d.placeholder.trim() !== def.placeholder
        ) {
          deepOverrides[key] = {
            label: d.label.trim() || def.label,
            placeholder: d.placeholder.trim() || def.placeholder,
            accessibilityLabel:
              d.accessibilityLabel.trim() ||
              d.placeholder.trim() ||
              def.accessibilityLabel,
          };
        }
      }

      const roundOverrides: SecondRoundQuestionsOverrides = {};
      const roundDefaults = getDefaultSecondRoundQuestions();
      for (const key of SECOND_ROUND_QUESTION_KEYS) {
        const d = roundDrafts[key];
        const def = roundDefaults[key];
        if (
          d.label.trim() !== def.label ||
          d.placeholder.trim() !== def.placeholder
        ) {
          roundOverrides[key] = {
            label: d.label.trim() || def.label,
            placeholder: d.placeholder.trim() || def.placeholder,
            accessibilityLabel:
              d.accessibilityLabel.trim() ||
              d.placeholder.trim() ||
              def.accessibilityLabel,
          };
        }
      }

      await Promise.all([
        saveDeepQuestionsOverrides(deepOverrides),
        saveSecondRoundQuestionsOverrides(roundOverrides),
      ]);
      showAlert(
        t("deepQuestionsPage.savedTitle"),
        t("deepQuestionsPage.savedBody")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await Promise.all([
      clearDeepQuestionsOverrides(),
      clearSecondRoundQuestionsOverrides(),
    ]);
    setDeepDrafts(resolveDeepQuestions());
    setRoundDrafts(resolveSecondRoundQuestions());
    showAlert(
      t("deepQuestionsPage.resetTitle"),
      t("deepQuestionsPage.resetBody")
    );
  }

  const inputClass = `border rounded-xl px-3 py-2 text-base ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar backLabel={t("nav.backSettings")} />
      <PastekScreenHero
        label={t("deepQuestionsPage.heroLabel")}
        title={t("deepQuestionsPage.heroTitle")}
        accent={t("deepQuestionsPage.heroAccent")}
        description={t("deepQuestionsPage.heroDescription")}
        className="mb-6"
      />

      <View className="gap-4 pb-8">
        <Text className={`text-xs uppercase tracking-wider ${textMuted(isDark)}`}>
          {t("deepQuestionsPage.sectionDeep")}
        </Text>
        {DEEP_QUESTION_KEYS.map((key, index) => (
          <View
            key={key}
            className={`rounded-2xl border px-4 py-4 gap-3 ${panelBg(isDark)}`}
          >
            <Text className={`text-xs uppercase tracking-wider ${textMuted(isDark)}`}>
              {t("deepQuestionsPage.question", { index: index + 1 })}
            </Text>
            <View className="gap-1">
              <Text className={`text-sm ${textPrimary(isDark)}`}>
                {t("deepQuestionsPage.label")}
              </Text>
              <TextInput
                value={deepDrafts[key].label}
                onChangeText={(v) => updateDeepField(key, "label", v)}
                className={inputClass}
              />
            </View>
            <View className="gap-1">
              <Text className={`text-sm ${textPrimary(isDark)}`}>
                {t("deepQuestionsPage.helper")}
              </Text>
              <TextInput
                value={deepDrafts[key].placeholder}
                onChangeText={(v) => updateDeepField(key, "placeholder", v)}
                multiline
                className={`${inputClass} min-h-[72px]`}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

        <Text
          className={`text-xs uppercase tracking-wider mt-4 ${textMuted(isDark)}`}
        >
          {t("deepQuestionsPage.sectionSecondRound")}
        </Text>
        <Text className={`text-sm leading-5 mb-1 ${textSecondary(isDark)}`}>
          {t("deepQuestionsPage.sectionSecondRoundHint")}
        </Text>
        {SECOND_ROUND_QUESTION_KEYS.map((key, index) => (
          <View
            key={key}
            className={`rounded-2xl border px-4 py-4 gap-3 ${panelBg(isDark)}`}
          >
            <Text className={`text-xs uppercase tracking-wider ${textMuted(isDark)}`}>
              {t("deepQuestionsPage.question", { index: index + 1 })}
            </Text>
            <View className="gap-1">
              <Text className={`text-sm ${textPrimary(isDark)}`}>
                {t("deepQuestionsPage.label")}
              </Text>
              <TextInput
                value={roundDrafts[key].label}
                onChangeText={(v) => updateRoundField(key, "label", v)}
                className={inputClass}
              />
            </View>
            <View className="gap-1">
              <Text className={`text-sm ${textPrimary(isDark)}`}>
                {t("deepQuestionsPage.helper")}
              </Text>
              <TextInput
                value={roundDrafts[key].placeholder}
                onChangeText={(v) => updateRoundField(key, "placeholder", v)}
                multiline
                className={`${inputClass} min-h-[72px]`}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

        <PrimaryButton
          label={
            saving ? t("deepQuestionsPage.saving") : t("deepQuestionsPage.save")
          }
          onPress={() => void handleSave()}
          disabled={saving}
        />
        <PrimaryButton
          label={t("deepQuestionsPage.reset")}
          onPress={() => void handleReset()}
          variant="ghost"
          disabled={saving}
        />
        <Text className={`text-xs leading-5 ${textSecondary(isDark)}`}>
          {t("deepQuestionsPage.localOnly")}
        </Text>
      </View>
    </ScreenContainer>
  );
}
