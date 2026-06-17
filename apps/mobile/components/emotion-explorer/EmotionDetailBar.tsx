import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { Emotion, EmotionQuadrant } from "@/lib/emotion-explorer";

interface EmotionDetailBarProps {
  emotion: Emotion;
  quadrant: EmotionQuadrant;
  loading?: boolean;
  onContinue: () => void;
}

export function EmotionDetailBar({
  emotion,
  quadrant,
  loading = false,
  onContinue,
}: EmotionDetailBarProps) {
  return (
    <View className="bg-sand-800 rounded-3xl px-5 py-5 mt-2">
      <View className="flex-row items-start gap-4">
        <View className="flex-1">
          <Text
            className="text-lg font-medium mb-2"
            style={{ color: quadrant.color }}
          >
            {emotion.label}
          </Text>
          <Text className="text-sand-100 text-sm leading-6">
            {emotion.description}
          </Text>
        </View>
        <Pressable
          onPress={onContinue}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Passer à l'exercice"
          className={`rounded-full items-center justify-center ${
            loading ? "opacity-50" : "active:opacity-80"
          }`}
          style={{
            width: 52,
            height: 52,
            backgroundColor: "#FAF7F4",
          }}
        >
          {loading ? (
            <ActivityIndicator color={quadrant.color} size="small" />
          ) : (
            <Text className="text-sand-800 text-2xl leading-none">→</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
