import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SecondRoundTransitionAnswers } from "@/lib/experience/types";
import { secondRoundTransitionComplete } from "@/lib/experience/types";
import { PrimaryButton } from "@/components/ui/Button";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const QUESTION_KEYS: (keyof SecondRoundTransitionAnswers)[] = [
  "gestureChange",
  "newIntention",
  "physicalState",
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
  const { t } = useTranslation("ritual");
  const inputClass = `border rounded-2xl px-4 py-3 text-base min-h-[72px] ${
    isDark
      ? "border-sand-600 bg-sand-800 text-sand-100"
      : "border-sand-200 bg-white text-sand-800"
  }`;

  return (
    <View accessibilityRole="form" className="gap-5">
      <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
        {t("secondRound.intro")}
      </Text>

      {QUESTION_KEYS.map((key) => {
        const placeholder = t(`secondRound.${key}.placeholder`);
        return (
          <View key={key} className="gap-2">
            <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
              {t(`secondRound.${key}.label`)}
            </Text>
            <TextInput
              value={answers[key]}
              onChangeText={(text) => onChange({ ...answers, [key]: text })}
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
      <View className="mt-2">
        <PrimaryButton
          label={loading ? t("secondRound.ctaLoading") : t("secondRound.cta")}
          onPress={onContinue}
          disabled={!secondRoundTransitionComplete(answers) || loading}
        />
      </View>
    </View>
  );
}
