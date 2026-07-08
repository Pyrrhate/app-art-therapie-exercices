import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { REFLECTION_PROMPT_VERSION } from "@art-therapie/shared";
import { PrimaryButton } from "@/components/ui/Button";
import { submitReflectionFeedback } from "@/lib/api";

export type FeedbackRating = 1 | 2 | 3;

const RATING_OPTIONS: {
  value: FeedbackRating;
  emoji: string;
  label: string;
}[] = [
  { value: 3, emoji: "🌟", label: "Parfait" },
  { value: 2, emoji: "🌿", label: "Intéressant" },
  { value: 1, emoji: "🥀", label: "À côté de la plaque" },
];

function storageKey(sessionId: string): string {
  return `@pastek/reflection-feedback/${sessionId}`;
}

interface FeedbackWidgetProps {
  sessionId: string;
  aiResponseText: string;
  promptVersion?: string;
}

type WidgetPhase = "rating" | "comment" | "submitting" | "thanks";

export function FeedbackWidget({
  sessionId,
  aiResponseText,
  promptVersion = REFLECTION_PROMPT_VERSION,
}: FeedbackWidgetProps) {
  const [phase, setPhase] = useState<WidgetPhase>("rating");
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(
    null
  );
  const [comment, setComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey(sessionId));
        if (!cancelled && stored === "1") {
          setPhase("thanks");
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const finalize = useCallback(
    async (rating: FeedbackRating, commentText: string) => {
      setPhase("submitting");
      const ok = await submitReflectionFeedback({
        rating,
        comment: commentText.trim() || null,
        ai_response_text: aiResponseText,
        prompt_version: promptVersion,
        session_id: sessionId,
      });

      try {
        await AsyncStorage.setItem(storageKey(sessionId), "1");
      } catch {
        /* ignore */
      }

      setPhase("thanks");

      if (!ok) {
        console.warn("[FeedbackWidget] envoi échoué — merci affiché côté UI");
      }
    },
    [aiResponseText, promptVersion, sessionId]
  );

  function handleRatingPress(rating: FeedbackRating) {
    if (phase === "submitting" || phase === "thanks") return;
    setSelectedRating(rating);
    if (rating === 1) {
      setPhase("comment");
      return;
    }
    void finalize(rating, "");
  }

  if (phase === "thanks") {
    return (
      <Animated.View
        entering={FadeIn.duration(420)}
        className="bg-sage-50/90 rounded-2xl border border-sage-100 px-5 py-5"
      >
        <Text className="text-sage-700 text-sm text-center leading-6">
          Merci pour votre retour.
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      exiting={FadeOut.duration(280)}
      className="bg-sand-50 rounded-2xl border border-sage-100 px-5 py-5"
    >
      <Text className="text-sand-700 text-sm text-center leading-6 mb-4">
        Ce miroir résonne-t-il juste pour vous ?
      </Text>

      <View className="flex-row justify-center gap-2 flex-wrap">
        {RATING_OPTIONS.map((option) => {
          const isSelected = selectedRating === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleRatingPress(option.value)}
              disabled={phase === "submitting"}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              className={`items-center rounded-2xl border px-3 py-3 min-w-[92px] ${
                isSelected
                  ? "bg-sage-100 border-sage-300"
                  : "bg-white/80 border-sand-200"
              } ${phase === "submitting" ? "opacity-50" : "active:opacity-80"}`}
            >
              <Text className="text-2xl mb-1">{option.emoji}</Text>
              <Text className="text-sage-700 text-xs font-medium text-center">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {(phase === "comment" || phase === "submitting") && selectedRating === 1 && (
        <Animated.View entering={FadeIn.duration(320)} className="mt-4">
          <Text className="text-sand-600 text-sm text-center mb-3 leading-5">
            Qu&apos;est-ce qui vous a dérangé ? (optionnel)
          </Text>
          <TextInput
            className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-sm min-h-[88px] mb-3"
            multiline
            textAlignVertical="top"
            placeholder="Vos mots, sans jugement…"
            placeholderTextColor="#A89F91"
            value={comment}
            onChangeText={setComment}
            editable={phase !== "submitting"}
          />
          <PrimaryButton
            label={phase === "submitting" ? "Envoi…" : "Partager mon ressenti"}
            onPress={() => void finalize(1, comment)}
            disabled={phase === "submitting"}
            variant="secondary"
            align="center"
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}
