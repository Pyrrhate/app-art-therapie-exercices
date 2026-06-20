import { Text, View } from "react-native";
import type { Emotion, EmotionQuadrant } from "@/lib/emotion-explorer";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface EmotionDetailBarProps {
  emotion: Emotion;
  quadrant: EmotionQuadrant;
}

export function EmotionDetailBar({ emotion, quadrant }: EmotionDetailBarProps) {
  const isDark = useIsDark();

  return (
    <View
      className={`rounded-2xl border px-5 py-5 ${
        isDark
          ? "bg-sand-800/80 border-sand-700"
          : "bg-white/80 border-sand-200"
      }`}
    >
      <Text
        className="font-display text-xl mb-2"
        style={{ color: quadrant.color, letterSpacing: -0.3 }}
      >
        {emotion.label}
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {emotion.description}
      </Text>
      <Text className={`text-xs mt-3 ${textMuted(isDark)}`}>
        {quadrant.title}
      </Text>
    </View>
  );
}
