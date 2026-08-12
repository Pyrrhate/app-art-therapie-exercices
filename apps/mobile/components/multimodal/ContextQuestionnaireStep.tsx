import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { MultimodalUserAnswers } from "@/lib/multimodal/types";
import {
  DEEP_QUESTION_KEYS,
  resolveDeepQuestions,
  getDeepQuestionsOverrides,
  type DeepQuestionKey,
} from "@/lib/deepQuestions";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export function preAnswersComplete(answers: MultimodalUserAnswers): boolean {
  return (
    answers.emotionalWord.trim().length >= 2 &&
    answers.anchorMoment.trim().length >= 2 &&
    answers.bodilyState.trim().length >= 2
  );
}

interface ContextQuestionnaireStepProps {
  answers: MultimodalUserAnswers;
  onChange: (answers: MultimodalUserAnswers) => void;
}

export function ContextQuestionnaireStep({
  answers,
  onChange,
}: ContextQuestionnaireStepProps) {
  const isDark = useIsDark();
  const [questions, setQuestions] = useState(() => resolveDeepQuestions());

  useEffect(() => {
    void getDeepQuestionsOverrides().then((overrides) => {
      setQuestions(resolveDeepQuestions(overrides));
    });
  }, []);

  const inputClass = `bg-white border rounded-2xl px-4 py-3 text-base min-h-[88px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 text-sand-800"
  }`;

  return (
    <View className="gap-6">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        Avant de partager votre création, prenez un instant pour ancrer ce que vous
        avez vécu. Ces mots guideront l&apos;accompagnement bienveillant — ils ne seront
        pas jugés.
      </Text>

      {DEEP_QUESTION_KEYS.map((key: DeepQuestionKey) => {
        const q = questions[key];
        return (
          <View key={key} className="gap-2">
            <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
              {q.label}
            </Text>
            <TextInput
              value={answers[key]}
              onChangeText={(text) => onChange({ ...answers, [key]: text })}
              placeholder={q.placeholder}
              placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
              multiline
              textAlignVertical="top"
              accessibilityLabel={q.accessibilityLabel}
              className={inputClass}
            />
          </View>
        );
      })}
    </View>
  );
}
