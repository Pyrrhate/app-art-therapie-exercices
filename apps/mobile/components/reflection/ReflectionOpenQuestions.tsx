import { Text, View } from "react-native";

const QUESTION_LABELS = [
  "Première invitation",
  "Deuxième invitation",
  "Troisième invitation",
];

interface ReflectionOpenQuestionsProps {
  questions: string[];
}

export function ReflectionOpenQuestions({
  questions,
}: ReflectionOpenQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <View className="gap-3 mt-5">
      <Text className="text-sage-600 text-xs uppercase tracking-wider">
        Questions d&apos;ouverture
      </Text>
      {questions.map((question, index) => (
        <View
          key={`${index}-${question.slice(0, 24)}`}
          className="bg-sage-50/80 rounded-2xl border border-sage-100 px-4 py-4"
        >
          <Text className="text-sage-600 text-xs font-medium mb-2">
            {QUESTION_LABELS[index] ?? `Question ${index + 1}`}
          </Text>
          <Text className="text-sand-700 text-sm leading-6">{question}</Text>
        </View>
      ))}
    </View>
  );
}
