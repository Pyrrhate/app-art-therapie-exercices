import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { IntegrationAnswers } from "@/lib/experience/types";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const QUESTIONS: {
  key: keyof IntegrationAnswers;
  required: boolean;
}[] = [
  { key: "resonance", required: true },
  { key: "intention", required: true },
  { key: "keeper", required: false },
];

interface IntegrationQuestionnaireStepProps {
  answers: IntegrationAnswers;
  onChange: (answers: IntegrationAnswers) => void;
}

export function IntegrationQuestionnaireStep({
  answers,
  onChange,
}: IntegrationQuestionnaireStepProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");
  const inputClass = `border rounded-2xl px-4 py-3 text-base min-h-[80px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <View accessibilityRole="form" className="gap-5">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        {t("integration.intro")}
      </Text>

      {QUESTIONS.map((q) => {
        const placeholder = t(`integration.${q.key}.placeholder`);
        return (
          <View key={q.key} className="gap-2">
            <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
              {t(`integration.${q.key}.label`)}
              {!q.required ? (
                <Text className={`font-normal ${textSecondary(isDark)}`}>
                  {t("integration.optional")}
                </Text>
              ) : null}
            </Text>
            <TextInput
              value={answers[q.key]}
              onChangeText={(text) => onChange({ ...answers, [q.key]: text })}
              placeholder={placeholder}
              placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
              multiline
              textAlignVertical="top"
              accessibilityLabel={placeholder}
              className={inputClass}
            />
          </View>
        );
      })}
    </View>
  );
}

export function integrationAnswersComplete(answers: IntegrationAnswers): boolean {
  return answers.resonance.trim().length >= 2 && answers.intention.trim().length >= 2;
}
