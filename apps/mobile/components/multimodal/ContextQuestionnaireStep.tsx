import { Text, TextInput, View } from "react-native";
import type { MultimodalUserAnswers } from "@/lib/multimodal/types";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const QUESTIONS: {
  key: keyof MultimodalUserAnswers;
  label: string;
  placeholder: string;
  accessibilityLabel: string;
}[] = [
  {
    key: "emotionalWord",
    label: "Ressenti émotionnel",
    placeholder:
      "Un mot, une émotion qui émerge en repensant à votre geste ou performance…",
    accessibilityLabel:
      "Quel mot ou quelle émotion vous vient en repensant à votre geste ou performance",
  },
  {
    key: "anchorMoment",
    label: "Le point d'ancrage",
    placeholder:
      "Un moment, un mouvement, un accord ou une couleur inattendu(e)…",
    accessibilityLabel:
      "Y a-t-il un moment précis qui a émergé de manière inattendue",
  },
  {
    key: "bodilyState",
    label: "L'état physique",
    placeholder: "Comment votre corps se sent-il maintenant, par rapport au début ?",
    accessibilityLabel:
      "Comment vous sentez-vous corporellement maintenant par rapport au début de l'exercice",
  },
];

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
  const inputClass = `bg-white border rounded-2xl px-4 py-3 text-base min-h-[88px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 text-sand-800"
  }`;

  return (
    <View accessibilityRole="form" className="gap-6">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        Avant de partager votre création, prenez un instant pour ancrer ce que vous
        avez vécu. Ces mots guideront l'accompagnement bienveillant — ils ne seront
        pas jugés.
      </Text>

      {QUESTIONS.map((q) => (
        <View key={q.key} className="gap-2">
          <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
            {q.label}
          </Text>
          <TextInput
            value={answers[q.key]}
            onChangeText={(text) => onChange({ ...answers, [q.key]: text })}
            placeholder={q.placeholder}
            placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
            multiline
            textAlignVertical="top"
            accessibilityLabel={q.accessibilityLabel}
            className={inputClass}
          />
        </View>
      ))}
    </View>
  );
}
