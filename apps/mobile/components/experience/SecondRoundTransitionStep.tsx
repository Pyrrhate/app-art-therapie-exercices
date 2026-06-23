import { Text, TextInput, View } from "react-native";
import type { SecondRoundTransitionAnswers } from "@/lib/experience/types";
import { secondRoundTransitionComplete } from "@/lib/experience/types";
import { PrimaryButton } from "@/components/ui/Button";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const QUESTIONS: {
  key: keyof SecondRoundTransitionAnswers;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "gestureChange",
    label: "Changement de geste",
    placeholder:
      "Qu'aimeriez-vous faire différemment dans ce second passage ?",
  },
  {
    key: "newIntention",
    label: "Nouvelle intention",
    placeholder: "Quelle intention portez-vous pour ce 2e tour ?",
  },
  {
    key: "physicalState",
    label: "Ressenti corporel",
    placeholder: "Comment se sent votre corps en ce moment ?",
  },
];

interface SecondRoundTransitionStepProps {
  answers: SecondRoundTransitionAnswers;
  onChange: (answers: SecondRoundTransitionAnswers) => void;
  onContinue: () => void;
  loading?: boolean;
}

export function SecondRoundTransitionStep({
  answers,
  onChange,
  onContinue,
  loading = false,
}: SecondRoundTransitionStepProps) {
  const isDark = useIsDark();
  const inputClass = `border rounded-2xl px-4 py-3 text-base min-h-[72px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <View accessibilityRole="form" className="gap-5">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        Trois questions flash avant de reprendre la création — vos réponses
        nourriront l&apos;exercice augmenté et l&apos;analyse du 2e tour.
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
            accessibilityLabel={q.placeholder}
            className={inputClass}
          />
        </View>
      ))}
      <View className="mt-2">
        <PrimaryButton
          label={loading ? "Préparation de l'exercice…" : "Commencer le 2e tour"}
          onPress={onContinue}
          disabled={!secondRoundTransitionComplete(answers) || loading}
        />
      </View>
    </View>
  );
}
