import { create } from "zustand";
import type { RitualDuration } from "@/constants";
import { sanitizeAiDisplayText, sanitizeQuestions } from "./sanitizeAiText";
import type { ArtisticTechnique, RitualState } from "./types";

interface RitualStore extends RitualState {
  setImpulse: (impulse: string) => void;
  setTechnique: (technique: ArtisticTechnique) => void;
  setDurationMinutes: (durationMinutes: RitualDuration) => void;
  setExercise: (exercise: string, durationMinutes?: number) => void;
  setPhotoUri: (uri: string) => void;
  setReflection: (reflection: string, openQuestions: string[]) => void;
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
  setReflection: (reflection, openQuestions) =>
    set({
      reflection: sanitizeAiDisplayText(reflection),
      openQuestions: sanitizeQuestions(openQuestions),
    }),
  reset: () => set(initialState),
}));
