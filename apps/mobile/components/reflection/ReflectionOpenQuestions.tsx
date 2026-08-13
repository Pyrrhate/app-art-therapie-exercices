import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const QUESTION_LABEL_KEYS = [
  "openQuestions.first",
  "openQuestions.second",
  "openQuestions.third",
];

interface ReflectionOpenQuestionsProps {
  questions: string[];
}

export function ReflectionOpenQuestions({
  questions,
}: ReflectionOpenQuestionsProps) {
  const { t } = useTranslation("ritual");

  if (questions.length === 0) return null;

  return (
    <View className="gap-3 mt-5">
      <Text className="text-sage-600 text-xs uppercase tracking-wider">
        {t("openQuestions.title")}
      </Text>
      {questions.map((question, index) => (
        <View
          key={`${index}-${question.slice(0, 24)}`}
          className="bg-sage-50/80 rounded-2xl border border-sage-100 px-4 py-4"
        >
          <Text className="text-sage-600 text-xs font-medium mb-2">
            {QUESTION_LABEL_KEYS[index]
              ? t(QUESTION_LABEL_KEYS[index])
              : t("openQuestions.fallback", { index: index + 1 })}
          </Text>
          <Text className="text-sand-700 text-sm leading-6">{question}</Text>
        </View>
      ))}
    </View>
  );
}
