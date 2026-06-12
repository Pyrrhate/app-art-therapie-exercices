import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Audio } from "expo-av";

interface GentleTimerProps {
  durationMinutes: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function GentleTimer({
  durationMinutes,
  onComplete,
  autoStart = true,
}: GentleTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const completedRef = useRef(false);

  const progress = Math.min(elapsed / totalSeconds, 1);
  const size = 200;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds && !completedRef.current) {
          completedRef.current = true;
          setRunning(false);
          playBell();
          onComplete?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, totalSeconds, onComplete]);

  async function playBell() {
    try {
      // Son doux généré via un asset futur ; pour le MVP, vibration silencieuse
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    } catch {
      // Ignorer si l'audio n'est pas disponible
    }
  }

  return (
    <View className="items-center justify-center py-8">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8DDD4"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6B8F71"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
}
