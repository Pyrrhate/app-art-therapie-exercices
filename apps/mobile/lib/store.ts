import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { STORAGE_KEYS, type RitualDuration } from "@/constants";
import {
  deriveExerciseKeywords,
  resolveExerciseKeywords,
} from "./exercise/keywords";
import { sanitizeAiDisplayText, sanitizeQuestions } from "./sanitizeAiText";
import type { ArtisticTechnique, RitualState, SavedSession } from "./types";
import type { ExperienceMode, IntegrationAnswers, Round1Snapshot, SecondRoundTransitionAnswers, EvolutionTriggers } from "@/lib/experience/types";
import { EMPTY_INTEGRATION_ANSWERS, EMPTY_SECOND_ROUND_ANSWERS } from "@/lib/experience/types";
import type { MultimodalUserAnswers } from "@/lib/multimodal/types";
import { EMPTY_USER_ANSWERS } from "@/lib/multimodal/types";
import type { CustomSessionConfig } from "@/lib/custom/types";
import { EMPTY_CUSTOM_SESSION_CONFIG } from "@/lib/custom/types";
import type { FilEntry } from "./fil/types";

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
  restoreFromFilEntry: (entry: FilEntry) => void;
  /** @deprecated Utiliser restoreFromFilEntry */
  restoreFromSession: (session: SavedSession) => void;
  setExperienceMode: (mode: ExperienceMode) => void;
  setPreAnswers: (answers: MultimodalUserAnswers) => void;
  setPostAnswers: (answers: IntegrationAnswers) => void;
  setTransitionAnswers: (answers: SecondRoundTransitionAnswers) => void;
  setRound1Snapshot: (snapshot: Round1Snapshot) => void;
  startSecondRound: (snapshot: Round1Snapshot) => void;
  /** @deprecated Utiliser startSecondRound */
  beginSecondRound: (snapshot: Round1Snapshot) => void;
  applyAugmentedExercise: (
    exercise: string,
    source: "ai" | "fallback",
    keywords?: string[]
  ) => void;
  completeSecondRoundPrep: () => void;
  ensureSessionExerciseId: () => string;
  setCustomSessionConfig: (patch: Partial<CustomSessionConfig>) => void;
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
  experienceMode: "express",
  preAnswers: { ...EMPTY_USER_ANSWERS },
  postAnswers: { ...EMPTY_INTEGRATION_ANSWERS },
  currentRound: 1,
  isSecondRoundPrep: false,
  round1Snapshot: null,
  transitionAnswers: { ...EMPTY_SECOND_ROUND_ANSWERS },
  evolutionTriggers: null,
  isExerciseAugmented: false,
  sessionExerciseId: "",
  customSessionConfig: { ...EMPTY_CUSTOM_SESSION_CONFIG },
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
  setExperienceMode: (experienceMode) => set({ experienceMode }),
  setPreAnswers: (preAnswers) => set({ preAnswers }),
  setPostAnswers: (postAnswers) => set({ postAnswers }),
  setTransitionAnswers: (transitionAnswers) => set({ transitionAnswers }),
  ensureSessionExerciseId: () => {
    const existing = get().sessionExerciseId;
    if (existing) return existing;
    const id = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    set({ sessionExerciseId: id });
    return id;
  },
  beginSecondRound: (snapshot) => get().startSecondRound(snapshot),
  setRound1Snapshot: (round1Snapshot) =>
    set({
      round1Snapshot,
      evolutionTriggers: round1Snapshot.evolutionTriggers,
    }),
  startSecondRound: (snapshot) =>
    set({
      currentRound: 2,
      isSecondRoundPrep: true,
      round1Snapshot: snapshot,
      evolutionTriggers: snapshot.evolutionTriggers,
      transitionAnswers: { ...EMPTY_SECOND_ROUND_ANSWERS },
      isExerciseAugmented: false,
      photoUri: null,
      reflection: null,
      openQuestions: [],
      followUpExercise: null,
      writtenText: "",
    }),
  applyAugmentedExercise: (exercise, source, keywords) => {
    const state = get();
    const exerciseText = sanitizeAiDisplayText(exercise);
    set({
      exercise: exerciseText,
      exerciseKeywords: resolveExerciseKeywords(
        state.impulse,
        state.technique,
        exerciseText,
        keywords
      ),
      exerciseSource: source,
      isExerciseAugmented: true,
      isSecondRoundPrep: false,
    });
  },
  completeSecondRoundPrep: () => set({ isSecondRoundPrep: false }),
  setCustomSessionConfig: (patch) =>
    set((state) => ({
      customSessionConfig: { ...state.customSessionConfig, ...patch },
    })),
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
  restoreFromFilEntry: (entry) => {
    const m = entry.metadata;
    if (!m?.technique || !m.exercise) return;
    set({
      impulse: m.impulse ?? entry.summary,
      technique: m.technique,
      exercise: sanitizeAiDisplayText(m.exercise),
      exerciseKeywords: deriveExerciseKeywords(
        m.impulse ?? entry.summary,
        m.technique
      ),
      durationMinutes: m.durationMinutes ?? 15,
      photoUri: m.photoUri ?? null,
      reflection: null,
      openQuestions: [],
      followUpExercise: m.followUpExercise
        ? sanitizeAiDisplayText(m.followUpExercise)
        : null,
      writtenText: m.writtenText ?? "",
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
