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
}

export function ZenWaitIndicator({ active }: ZenWaitIndicatorProps) {
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
      <Text className="text-sand-400 text-xs mt-2">Compteur zen — sans limite de temps</Text>
    </View>
  );
}
