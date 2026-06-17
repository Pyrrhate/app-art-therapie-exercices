import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import {
  nextZenPhraseIndex,
  pickRandomZenPhraseIndex,
  ZEN_TIMER_PHRASES,
} from "@/lib/exercise/zenPhrases";
import { playTimerSound } from "@/lib/sounds";

interface GentleTimerProps {
  durationMinutes: number;
  onComplete?: () => void;
  autoStart?: boolean;
  completionSound?: "gong" | "chime" | "none";
}

const PHRASE_ROTATION_MS = 22_000;
const TICK_MS = 200;

export function GentleTimer({
  durationMinutes,
  onComplete,
  autoStart = true,
  completionSound = "gong",
}: GentleTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const [phraseIndex, setPhraseIndex] = useState(pickRandomZenPhraseIndex);
  const completedRef = useRef(false);
  const anchorMsRef = useRef<number | null>(autoStart ? Date.now() : null);
  const pausedElapsedRef = useRef(0);

  const progress = Math.min(elapsed / totalSeconds, 1);
  const size = 200;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const isComplete = elapsed >= totalSeconds;

  useEffect(() => {
    setElapsed(0);
    setRunning(autoStart);
    setPhraseIndex(pickRandomZenPhraseIndex());
    completedRef.current = false;
    pausedElapsedRef.current = 0;
    anchorMsRef.current = autoStart ? Date.now() : null;
  }, [durationMinutes, autoStart]);

  useEffect(() => {
    if (!running || isComplete) return;

    const interval = setInterval(() => {
      if (anchorMsRef.current === null) return;
      const next = Math.min(
        totalSeconds,
        Math.floor((Date.now() - anchorMsRef.current) / 1000)
      );
      setElapsed(next);

      if (next >= totalSeconds && !completedRef.current) {
        completedRef.current = true;
        setRunning(false);
        anchorMsRef.current = null;
        void playCompletionCue();
        onComplete?.();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [running, totalSeconds, onComplete, isComplete]);

  useEffect(() => {
    if (!running || isComplete) return;
    const interval = setInterval(() => {
      setPhraseIndex((current) => nextZenPhraseIndex(current));
    }, PHRASE_ROTATION_MS);
    return () => clearInterval(interval);
  }, [running, isComplete]);

  async function playCompletionCue() {
    try {
      await playTimerSound(completionSound);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch {
      // Ignorer si haptique indisponible
    }
  }

  function togglePause() {
    if (isComplete) return;
    setRunning((wasRunning) => {
      if (wasRunning) {
        pausedElapsedRef.current = elapsed;
        anchorMsRef.current = null;
        return false;
      }
      anchorMsRef.current = Date.now() - pausedElapsedRef.current * 1000;
      return true;
    });
  }

  const remaining = Math.max(totalSeconds - elapsed, 0);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <View className="items-center justify-center py-8">
      <View style={{ width: size, height: size }}>
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
            stroke={isComplete ? "#A8856A" : "#6B8F71"}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-sand-700 text-2xl font-light">
            {isComplete
              ? "0:00"
              : `${mins}:${secs.toString().padStart(2, "0")}`}
          </Text>
        </View>
      </View>

      {!isComplete && (
        <Pressable
          onPress={togglePause}
          className="mt-4 px-5 py-2 rounded-full bg-sand-100 border border-sand-200"
        >
          <Text className="text-sand-600 text-sm">
            {running ? "Pause" : "Reprendre"}
          </Text>
        </Pressable>
      )}

      {!isComplete && (
        <Text className="text-sand-500 text-sm mt-4 text-center leading-6 px-6 min-h-[48px]">
          {ZEN_TIMER_PHRASES[phraseIndex]}
        </Text>
      )}

      {isComplete && (
        <Text className="text-sage-500 text-sm mt-4 text-center px-6">
          Moment terminé — prenez le temps de respirer
        </Text>
      )}
    </View>
  );
}
