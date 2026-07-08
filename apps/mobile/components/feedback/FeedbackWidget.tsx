import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn } from "react-native-reanimated";
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

interface StoredFeedback {
  rating: FeedbackRating;
  comment: string;
}

interface FeedbackWidgetProps {
  sessionId: string;
  aiResponseText: string;
  promptVersion?: string;
}

export function FeedbackWidget({
  sessionId,
  aiResponseText,
  promptVersion = REFLECTION_PROMPT_VERSION,
}: FeedbackWidgetProps) {
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedRating, setSavedRating] = useState<FeedbackRating | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(sessionId));
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as StoredFeedback;
        if (parsed?.rating) {
          setSelectedRating(parsed.rating);
          setComment(parsed.comment ?? "");
          setSavedRating(parsed.rating);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const persist = useCallback(
    async (rating: FeedbackRating, commentText: string) => {
      setSubmitting(true);
      const ok = await submitReflectionFeedback({
        rating,
        comment: commentText.trim() || null,
        ai_response_text: aiResponseText,
        prompt_version: promptVersion,
        session_id: sessionId,
      });

      try {
        await AsyncStorage.setItem(
          storageKey(sessionId),
          JSON.stringify({ rating, comment: commentText.trim() })
        );
      } catch {
        /* ignore */
      }

      setSavedRating(rating);
      setSubmitting(false);

      if (!ok) {
        console.warn("[FeedbackWidget] envoi échoué — retour conservé côté UI");
      }
    },
    [aiResponseText, promptVersion, sessionId]
  );

  function handleRatingPress(rating: FeedbackRating) {
    if (submitting) return;
    setSelectedRating(rating);
    if (rating !== 1) {
      void persist(rating, comment);
    }
  }

  const showConfirmation = savedRating !== null;
  const canSubmitLow = selectedRating === 1 && !submitting;

  return (
    <Animated.View
      entering={FadeIn.duration(320)}
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
              disabled={submitting}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
              className={`items-center rounded-2xl border px-3 py-3 min-w-[92px] ${
                isSelected
                  ? "bg-sage-100 border-sage-300"
                  : "bg-white/80 border-sand-200"
              } ${submitting ? "opacity-50" : "active:opacity-80"}`}
            >
              <Text className="text-2xl mb-1">{option.emoji}</Text>
              <Text className="text-sage-700 text-xs font-medium text-center">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedRating === 1 && (
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
            editable={!submitting}
          />
          <PrimaryButton
            label={
              submitting
                ? "Envoi…"
                : savedRating === 1
                  ? "Mettre à jour mon retour"
                  : "Partager mon ressenti"
            }
            onPress={() => void persist(1, comment)}
            disabled={!canSubmitLow}
            variant="secondary"
            align="center"
          />
        </Animated.View>
      )}

      {showConfirmation && (
        <Text className="text-sage-600 text-xs text-center mt-4 leading-5">
          Merci pour votre retour — vous pouvez le modifier tant que vous êtes
          sur cette page.
        </Text>
      )}
    </Animated.View>
  );
}
