import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const MESSAGES = [
  "Respirez lentement…",
  "Votre création mérite d'être accueillie.",
  "Prenez ce temps pour vous.",
  "L'analyse se tisse en douceur…",
];

interface ZenWaitIndicatorProps {
  active: boolean;
  /** Durée estimée en secondes (affichage approximatif). */
  estimatedSeconds?: number;
}

function formatApproxDuration(totalSeconds: number): string {
  if (totalSeconds <= 50) {
    return `Environ ${totalSeconds} s`;
  }
  const min = Math.max(1, Math.round(totalSeconds / 60));
  const max = Math.max(min, Math.round((totalSeconds * 1.35) / 60));
  if (min === max) {
    return `Environ ${min} min`;
  }
  return `Environ ${min} à ${max} min`;
}

export function ZenWaitIndicator({
  active,
  estimatedSeconds = 75,
}: ZenWaitIndicatorProps) {
  const [seconds, setSeconds] = useState(0);
  const breath = useSharedValue(0.85);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      breath.value = 0.85;
      return;
    }

    breath.value = withRepeat(
      withTiming(1.12, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [active, breath]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
    opacity: 0.35 + (breath.value - 0.85) * 1.2,
  }));

  if (!active) return null;

  const message = MESSAGES[Math.floor(seconds / 8) % MESSAGES.length];
  const approxLabel = formatApproxDuration(estimatedSeconds);
  const nearingEnd =
    estimatedSeconds > 0 && seconds >= Math.round(estimatedSeconds * 0.85);

  return (
    <View className="items-center py-6 mb-2">
      <View className="items-center justify-center mb-4" style={{ width: 88, height: 88 }}>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#6B8F71",
            },
            circleStyle,
          ]}
        />
        <View
          className="items-center justify-center rounded-full bg-sage-50 border border-sage-200"
          style={{ width: 56, height: 56 }}
        >
          <Text className="text-sage-600 text-lg font-light">{seconds}</Text>
        </View>
      </View>
      <Text className="text-sand-600 text-sm text-center leading-6 px-4">{message}</Text>
      <Text className="text-sand-400 text-xs mt-2">
        {nearingEnd ? "Presque prêt…" : approxLabel}
      </Text>
    </View>
  );
}
