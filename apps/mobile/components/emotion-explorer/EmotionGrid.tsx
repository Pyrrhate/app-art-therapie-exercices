import { Platform, Text, View } from "react-native";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
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
    <View className="flex-row flex-wrap justify-center gap-3 px-1 pb-6">
      {emotions.map((emotion) => {
        const selected = emotion.id === selectedId;
        return (
          <HoverScale
            key={emotion.id}
            onPress={() => onSelect(emotion)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            hoverScale={1.04}
            style={{ width: "30%", minWidth: 96, maxWidth: 124 }}
          >
            <View
              className="rounded-full items-center justify-center px-2 py-4"
              style={{
                backgroundColor: quadrant.bubbleColor,
                borderWidth: selected ? 2.5 : 0,
                borderColor: selected ? quadrant.color : "transparent",
                minHeight: 92,
                ...(selected && Platform.OS === "web"
                  ? ({
                      boxShadow: `0 0 0 4px ${quadrant.color}33`,
                    } as const)
                  : null),
              }}
            >
              <Text
                className="font-display text-sand-900 text-center leading-5"
                style={{ fontSize: 14, letterSpacing: -0.2 }}
                numberOfLines={2}
              >
                {emotion.label}
              </Text>
            </View>
          </HoverScale>
        );
      })}
    </View>
  );
}
