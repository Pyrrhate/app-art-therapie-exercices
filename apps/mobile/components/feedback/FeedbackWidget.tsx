import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn } from "react-native-reanimated";
import { REFLECTION_PROMPT_VERSION } from "@art-therapie/shared";
import { PrimaryButton } from "@/components/ui/Button";
import { submitReflectionFeedback } from "@/lib/api";
import {
  reflectionFeedbackStorageKey,
  type FeedbackRating,
  type StoredReflectionFeedback,
} from "@/lib/feedback/reflectionFeedback";

export type { FeedbackRating };

const RATING_OPTIONS: {
  value: FeedbackRating;
  emoji: string;
  labelKey: string;
}[] = [
  { value: 3, emoji: "🌟", labelKey: "feedback.ratingGreat" },
  { value: 2, emoji: "🌿", labelKey: "feedback.ratingOk" },
  { value: 1, emoji: "🥀", labelKey: "feedback.ratingOff" },
];

function storageKey(sessionId: string): string {
  return reflectionFeedbackStorageKey(sessionId);
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
  const { t } = useTranslation("ritual");
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
        const parsed = JSON.parse(raw) as StoredReflectionFeedback;
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
        {t("feedback.question")}
      </Text>

      <View className="flex-row justify-center gap-2 flex-wrap">
        {RATING_OPTIONS.map((option) => {
          const isSelected = selectedRating === option.value;
          const label = t(option.labelKey);
          return (
            <Pressable
              key={option.value}
              onPress={() => handleRatingPress(option.value)}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={label}
              className={`items-center rounded-2xl border px-3 py-3 min-w-[92px] ${
                isSelected
                  ? "bg-sage-100 border-sage-300"
                  : "bg-white/80 border-sand-200"
              } ${submitting ? "opacity-50" : "active:opacity-80"}`}
            >
              <Text className="text-2xl mb-1">{option.emoji}</Text>
              <Text className="text-sage-700 text-xs font-medium text-center">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedRating === 1 && (
        <Animated.View entering={FadeIn.duration(320)} className="mt-4">
          <Text className="text-sand-600 text-sm text-center mb-3 leading-5">
            {t("feedback.lowPrompt")}
          </Text>
          <TextInput
            className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-sm min-h-[88px] mb-3"
            multiline
            textAlignVertical="top"
            placeholder={t("feedback.commentPlaceholder")}
            placeholderTextColor="#A89F91"
            value={comment}
            onChangeText={setComment}
            editable={!submitting}
          />
          <PrimaryButton
            label={
              submitting
                ? t("feedback.submitting")
                : savedRating === 1
                  ? t("feedback.update")
                  : t("feedback.share")
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
          {t("feedback.thanks")}
        </Text>
      )}
    </Animated.View>
  );
}
