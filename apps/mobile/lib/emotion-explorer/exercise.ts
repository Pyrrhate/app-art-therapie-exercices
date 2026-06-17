import type { ArtisticTechnique } from "@/lib/types";
import type { Emotion, EmotionQuadrantId } from "./types";

const QUADRANT_TECHNIQUES: Record<EmotionQuadrantId, ArtisticTechnique> = {
  high_unpleasant: "mixed_media",
  high_pleasant: "painting",
  low_unpleasant: "drawing",
  low_pleasant: "painting",
};

const EMOTION_TECHNIQUE_OVERRIDES: Partial<Record<string, ArtisticTechnique>> = {
  confused: "writing",
  overwhelmed: "collage",
  bored: "collage",
  lonely: "writing",
  melancholic: "mixed_media",
  inspired: "mixed_media",
  playful: "collage",
  tired: "drawing",
};

export function suggestTechnique(
  quadrantId: EmotionQuadrantId,
  emotionId: string
): ArtisticTechnique {
  return (
    EMOTION_TECHNIQUE_OVERRIDES[emotionId] ?? QUADRANT_TECHNIQUES[quadrantId]
  );
}

export function buildImpulseFromEmotion(emotion: Emotion): string {
  return `Émotion ressentie : ${emotion.label} — ${emotion.description}`;
}

export function buildExerciseContext(emotion: Emotion): {
  impulse: string;
  technique: ArtisticTechnique;
} {
  return {
    impulse: buildImpulseFromEmotion(emotion),
    technique: suggestTechnique(emotion.quadrantId, emotion.id),
  };
}
