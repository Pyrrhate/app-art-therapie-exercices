import { create } from "zustand";
import type { RitualDuration } from "@/constants";
import { clearRitualDraft } from "./ritualDraft";
import { sanitizeAiDisplayText, sanitizeQuestions } from "./sanitizeAiText";
import type { ArtisticTechnique, RitualState, SavedSession } from "./types";

interface RitualStore extends RitualState {
  setImpulse: (impulse: string) => void;
  setTechnique: (technique: ArtisticTechnique) => void;
  setDurationMinutes: (durationMinutes: RitualDuration) => void;
  setExercise: (exercise: string, durationMinutes?: number) => void;
  setPhotoUri: (uri: string | null) => void;
  setWrittenText: (writtenText: string) => void;
  setReflection: (
    reflection: string,
    openQuestions: string[],
    followUpExercise?: string | null
  ) => void;
  startFollowUpExercise: () => void;
  restoreFromSession: (session: SavedSession) => void;
  reset: () => void;
}

const initialState: RitualState = {
  impulse: "",
  technique: null,
  exercise: "",
  durationMinutes: 15,
  photoUri: null,
  reflection: null,
  openQuestions: [],
  followUpExercise: null,
  writtenText: "",
};

export const useRitualStore = create<RitualStore>((set, get) => ({
  ...initialState,
  setImpulse: (impulse) => set({ impulse }),
  setTechnique: (technique) => set({ technique }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
  setExercise: (exercise, durationMinutes) =>
    set({
      exercise: sanitizeAiDisplayText(exercise),
      durationMinutes: durationMinutes ?? get().durationMinutes,
    }),
  setPhotoUri: (photoUri) => set({ photoUri }),
  setWrittenText: (writtenText) => set({ writtenText }),
  setReflection: (reflection, openQuestions, followUpExercise) =>
    set({
      reflection: sanitizeAiDisplayText(reflection),
      openQuestions: sanitizeQuestions(openQuestions),
      followUpExercise: followUpExercise
        ? sanitizeAiDisplayText(followUpExercise)
        : null,
    }),
  startFollowUpExercise: () => {
    const follow = get().followUpExercise;
    if (!follow) return;
    set({
      exercise: sanitizeAiDisplayText(follow),
      reflection: null,
      openQuestions: [],
      followUpExercise: null,
      photoUri: null,
      writtenText: "",
    });
  },
  restoreFromSession: (session) =>
    set({
      impulse: session.impulse,
      technique: session.technique,
      exercise: sanitizeAiDisplayText(session.exercise),
      durationMinutes: session.durationMinutes,
      photoUri: session.photoUri ?? null,
      reflection: null,
      openQuestions: [],
      followUpExercise: session.followUpExercise
        ? sanitizeAiDisplayText(session.followUpExercise)
        : null,
      writtenText: session.writtenText ?? "",
    }),
  reset: () => {
    void clearRitualDraft();
    set(initialState);
  },
}));
