import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
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

function ResetIcon({ color = "#8A7A6E" }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M12 5V2L7 7l5 5V8c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.939 7.939 0 0020 14c0-4.42-3.58-8-8-8z"
        fill={color}
      />
      <Path
        d="M12 19v3l5-5-5-5v3c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.939 7.939 0 004 10c0 4.42 3.58 8 8 8z"
        fill={color}
        opacity={0.55}
      />
    </Svg>
  );
}

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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const progress = Math.min(elapsed / totalSeconds, 1);
  const size = 200;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const isComplete = elapsed >= totalSeconds;

  const playCompletionCue = useCallback(async () => {
    try {
      await playTimerSound(completionSound);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch {
      /* haptique optionnelle */
    }
  }, [completionSound]);

  const finishTimer = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false);
    anchorMsRef.current = null;
    pausedElapsedRef.current = totalSeconds;
    setElapsed(totalSeconds);
    void playCompletionCue();
    onCompleteRef.current?.();
  }, [playCompletionCue, totalSeconds]);

  useEffect(() => {
    if (!running || isComplete) return;

    const interval = setInterval(() => {
      if (anchorMsRef.current === null) return;
      const next = Math.min(
        totalSeconds,
        Math.floor((Date.now() - anchorMsRef.current) / 1000)
      );
      setElapsed(next);
      pausedElapsedRef.current = next;

      if (next >= totalSeconds) {
        finishTimer();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [running, totalSeconds, isComplete, finishTimer]);

  useEffect(() => {
    if (elapsed >= totalSeconds) {
      if (!completedRef.current) {
        finishTimer();
      }
      return;
    }
    completedRef.current = false;
  }, [totalSeconds, elapsed, finishTimer]);

  useEffect(() => {
    if (!running || isComplete) return;
    const interval = setInterval(() => {
      setPhraseIndex((current) => nextZenPhraseIndex(current));
    }, PHRASE_ROTATION_MS);
    return () => clearInterval(interval);
  }, [running, isComplete]);

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

  function handleReset() {
    completedRef.current = false;
    setElapsed(0);
    pausedElapsedRef.current = 0;
    setPhraseIndex(pickRandomZenPhraseIndex());
    if (running) {
      anchorMsRef.current = Date.now();
    } else {
      anchorMsRef.current = null;
    }
  }

  const remaining = Math.max(totalSeconds - elapsed, 0);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <View className="items-center justify-center py-5">
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

      <View className="flex-row items-center gap-3 mt-4">
        {!isComplete && (
          <Pressable
            onPress={togglePause}
            className="px-5 py-2 rounded-full bg-sand-100 border border-sand-200"
          >
            <Text className="text-sand-600 text-sm">
              {running ? "Pause" : "Reprendre"}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Remise à zéro du timer"
          className="w-10 h-10 rounded-full bg-sand-100 border border-sand-200 items-center justify-center"
        >
          <ResetIcon />
        </Pressable>
      </View>

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
