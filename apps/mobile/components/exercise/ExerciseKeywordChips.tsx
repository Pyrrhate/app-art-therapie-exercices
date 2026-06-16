import { Text, View } from "react-native";

interface ExerciseKeywordChipsProps {
  keywords: string[];
}

export function ExerciseKeywordChips({ keywords }: ExerciseKeywordChipsProps) {
  if (keywords.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
        À garder sous les yeux
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {keywords.map((word) => (
          <View
            key={word}
            className="bg-sage-500 rounded-full px-4 py-2 border border-sage-600/20"
          >
            <Text className="text-white text-sm font-medium tracking-wide">
              {word}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
