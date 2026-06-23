import { Text, TextInput, View } from "react-native";
import type { IntegrationAnswers } from "@/lib/experience/types";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const QUESTIONS: {
  key: keyof IntegrationAnswers;
  label: string;
  placeholder: string;
  required: boolean;
}[] = [
  {
    key: "resonance",
    label: "Ce qui résonne",
    placeholder: "Qu'est-ce qui résonne en vous après cette réflexion ?",
    required: true,
  },
  {
    key: "intention",
    label: "Intention pour la suite",
    placeholder: "Quelle est votre intention pour la suite de cette journée ?",
    required: true,
  },
  {
    key: "keeper",
    label: "À garder précieusement (optionnel)",
    placeholder: "Y a-t-il un mot, une image ou une sensation à emporter ?",
    required: false,
  },
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
  const inputClass = `border rounded-2xl px-4 py-3 text-base min-h-[80px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <View accessibilityRole="form" className="gap-5">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        Prenez un moment pour intégrer ce que vous venez de recevoir. Ces mots clôturent
        votre séance en douceur.
      </Text>

      {QUESTIONS.map((q) => (
        <View key={q.key} className="gap-2">
          <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
            {q.label}
            {!q.required ? (
              <Text className={`font-normal ${textSecondary(isDark)}`}> (optionnel)</Text>
            ) : null}
          </Text>
          <TextInput
            value={answers[q.key]}
            onChangeText={(text) => onChange({ ...answers, [q.key]: text })}
            placeholder={q.placeholder}
            placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
            multiline
            textAlignVertical="top"
            accessibilityLabel={q.placeholder}
            className={inputClass}
          />
        </View>
      ))}
    </View>
  );
}

export function integrationAnswersComplete(answers: IntegrationAnswers): boolean {
  return answers.resonance.trim().length >= 2 && answers.intention.trim().length >= 2;
}
