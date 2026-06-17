import { ActivityIndicator, Text, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
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
        <HoverScale
          onPress={onContinue}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Passer à l'exercice"
          hoverScale={1.1}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#FAF7F4",
            alignItems: "center",
            justifyContent: "center",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={quadrant.color} size="small" />
          ) : (
            <Text className="text-sand-800 text-2xl leading-none">→</Text>
          )}
        </HoverScale>
      </View>
    </View>
  );
}
