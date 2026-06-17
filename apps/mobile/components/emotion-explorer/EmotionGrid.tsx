import { Pressable, Text, View } from "react-native";
import type { Emotion, EmotionQuadrant } from "@/lib/emotion-explorer";

interface EmotionGridProps {
  emotions: Emotion[];
  quadrant: EmotionQuadrant;
  selectedId: string | null;
  onSelect: (emotion: Emotion) => void;
}

export function EmotionGrid({
  emotions,
  quadrant,
  selectedId,
  onSelect,
}: EmotionGridProps) {
  return (
    <View className="flex-row flex-wrap justify-center gap-3 px-1 pb-4">
      {emotions.map((emotion) => {
        const selected = emotion.id === selectedId;
        return (
          <Pressable
            key={emotion.id}
            onPress={() => onSelect(emotion)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="active:opacity-90"
            style={{ width: "30%", minWidth: 96, maxWidth: 120 }}
          >
            <View
              className="rounded-full items-center justify-center px-2 py-4 border-2"
              style={{
                backgroundColor: quadrant.bubbleColor,
                borderColor: selected ? quadrant.color : "transparent",
                minHeight: 88,
                transform: [{ scale: selected ? 1.04 : 1 }],
              }}
            >
              <Text
                className="text-sand-900 text-sm font-medium text-center leading-5"
                numberOfLines={2}
              >
                {emotion.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
