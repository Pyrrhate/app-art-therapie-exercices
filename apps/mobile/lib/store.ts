import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { STORAGE_KEYS, type RitualDuration } from "@/constants";
import {
  deriveExerciseKeywords,
  resolveExerciseKeywords,
} from "./exercise/keywords";
import { sanitizeAiDisplayText, sanitizeQuestions } from "./sanitizeAiText";
import type { ArtisticTechnique, RitualState, SavedSession } from "./types";
interface RitualStore extends RitualState {
  setImpulse: (impulse: string) => void;
  setTechnique: (technique: ArtisticTechnique) => void;
  setDurationMinutes: (durationMinutes: RitualDuration) => void;
  setExercise: (
    exercise: string,
    durationMinutes?: number,
    source?: "ai" | "fallback" | null,
    keywords?: string[]
  ) => void;
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
  exerciseSource: null,
  exerciseKeywords: [],
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
  setExercise: (exercise, durationMinutes, source, keywords) => {
    const technique = get().technique;
    const impulse = get().impulse;
    const exerciseText = sanitizeAiDisplayText(exercise);
    const resolved = resolveExerciseKeywords(
      impulse,
      technique,
      exerciseText,
      keywords
    );
    set({
      exercise: exerciseText,
      durationMinutes: durationMinutes ?? get().durationMinutes,
      exerciseKeywords: resolved,
      ...(source !== undefined ? { exerciseSource: source } : {}),
    });
  },
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
    const state = get();
    const follow = state.followUpExercise;
    if (!follow) return;
    set({
      exercise: sanitizeAiDisplayText(follow),
      exerciseKeywords: deriveExerciseKeywords(state.impulse, state.technique),
      reflection: null,
      openQuestions: [],
      followUpExercise: null,
      photoUri: null,
      writtenText: "",
      exerciseSource: null,
    });
  },
  restoreFromSession: (session) =>
    set({
      impulse: session.impulse,
      technique: session.technique,
      exercise: sanitizeAiDisplayText(session.exercise),
      exerciseKeywords: deriveExerciseKeywords(session.impulse, session.technique),
      durationMinutes: session.durationMinutes,
      photoUri: session.photoUri ?? null,
      reflection: null,
      openQuestions: [],
      followUpExercise: session.followUpExercise
        ? sanitizeAiDisplayText(session.followUpExercise)
        : null,
      writtenText: session.writtenText ?? "",
      exerciseSource: null,
    }),
  reset: () => {
    void AsyncStorage.removeItem(STORAGE_KEYS.ritualDraft);
    set(initialState);
  },}));
