import { create } from "zustand";
import type { ArtisticTechnique, RitualState } from "./types";

interface RitualStore extends RitualState {
  setImpulse: (impulse: string) => void;
  setTechnique: (technique: ArtisticTechnique) => void;
  setExercise: (exercise: string, durationMinutes: number) => void;
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

export const useRitualStore = create<RitualStore>((set) => ({
  ...initialState,
  setImpulse: (impulse) => set({ impulse }),
  setTechnique: (technique) => set({ technique }),
  setExercise: (exercise, durationMinutes) =>
    set({ exercise, durationMinutes }),
  setPhotoUri: (photoUri) => set({ photoUri }),
  setReflection: (reflection, openQuestions) =>
    set({ reflection, openQuestions }),
  reset: () => set(initialState),
}));
