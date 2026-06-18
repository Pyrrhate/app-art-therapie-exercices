import { Text, View } from "react-native";
import type { Emotion, EmotionQuadrant } from "@/lib/emotion-explorer";

interface EmotionDetailBarProps {
  emotion: Emotion;
  quadrant: EmotionQuadrant;
}

export function EmotionDetailBar({ emotion, quadrant }: EmotionDetailBarProps) {
  return (
    <View className="bg-sand-800 rounded-3xl px-5 py-5 mt-2">
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
  );
}
