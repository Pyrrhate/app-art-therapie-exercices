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
    label: "Évolution du geste",
    placeholder:
      "Qu'est-ce qui a changé dans ton geste ou ton approche par rapport au premier essai ?",
  },
  {
    key: "newIntention",
    label: "Nouvelle intention",
    placeholder: "Quelle nouvelle intention as-tu mise dans cette création ?",
  },
  {
    key: "physicalState",
    label: "Ressenti corporel",
    placeholder: "Comment te sens-tu physiquement maintenant ?",
  },
];

interface SecondRoundTransitionStepProps {
  answers: SecondRoundTransitionAnswers;
  onChange: (answers: SecondRoundTransitionAnswers) => void;
  onContinue: () => void;
}

export function SecondRoundTransitionStep({
  answers,
  onChange,
  onContinue,
}: SecondRoundTransitionStepProps) {
  const isDark = useIsDark();
  const inputClass = `border rounded-2xl px-4 py-3 text-base min-h-[80px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <View accessibilityRole="form" className="gap-5">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        Avant d&apos;analyser votre seconde création, trois questions flash pour
        saisir ce qui a évolué entre les deux essais.
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
          label="Continuer vers la capture"
          onPress={onContinue}
          disabled={!secondRoundTransitionComplete(answers)}
        />
      </View>
    </View>
  );
}
