import type { RitualDraftStep, ReflectionDraftExtras, RitualDraft } from "@/lib/ritualDraft";
import {
  clearRitualDraft,
  saveRitualDraft,
} from "@/lib/ritualDraft";
import { useRitualStore } from "@/lib/store";

export async function persistRitualDraft(
  step: RitualDraftStep,
  reflectionExtras?: ReflectionDraftExtras
): Promise<void> {
  const state = useRitualStore.getState();
  if (!state.exercise?.trim() || !state.technique || !state.impulse.trim()) {
    return;
  }

  const draft: RitualDraft = {
    impulse: state.impulse,
    technique: state.technique,
    exercise: state.exercise,
    exerciseDevelopment: state.exerciseDevelopment,
    moduleStatement: state.moduleStatement,
    exerciseKeywords: state.exerciseKeywords,
    durationMinutes: state.durationMinutes,
    step,
    photoUri: state.photoUri,
    writtenText: state.writtenText,
    colorContext: state.colorContext,
    paletteColors: state.paletteColors.length ? state.paletteColors : undefined,
    seasonRunId: state.seasonRunId,
    seasonTitle: state.seasonTitle,
    reflectionExtras,
    updatedAt: new Date().toISOString(),
  };

  await saveRitualDraft(draft);
}

export async function discardRitualDraft(): Promise<void> {
  await clearRitualDraft();
}

export function hydrateRitualFromDraft(draft: RitualDraft): void {
  const store = useRitualStore.getState();
  store.setImpulse(draft.impulse);
  store.setTechnique(draft.technique);
  store.setDurationMinutes(draft.durationMinutes);
  store.setExercise(
    draft.exercise,
    draft.durationMinutes,
    null,
    draft.exerciseKeywords,
    null,
    draft.exerciseDevelopment
  );
  if (draft.moduleStatement) {
    store.setModuleStatement(draft.moduleStatement);
  }
  if (draft.photoUri) store.setPhotoUri(draft.photoUri);
  if (draft.writtenText) store.setWrittenText(draft.writtenText);
  if (draft.colorContext || draft.paletteColors?.length) {
    store.setColorContext(draft.colorContext ?? null, draft.paletteColors);
  }
  if (draft.seasonRunId || draft.seasonTitle) {
    store.setSeason(draft.seasonRunId ?? null, draft.seasonTitle ?? null);
  }

  const extras = draft.reflectionExtras;
  if (!extras) return;

  if (extras.experienceMode) {
    store.setExperienceMode(extras.experienceMode);
  }
  if (extras.preAnswers) {
    store.setPreAnswers(extras.preAnswers);
  }
  if (extras.postAnswers) {
    store.setPostAnswers(extras.postAnswers);
  }
  if (extras.transitionAnswers) {
    store.setTransitionAnswers(extras.transitionAnswers);
  }
  if (extras.round1Snapshot) {
    store.setRound1Snapshot(extras.round1Snapshot);
  }
  if (extras.currentRound === 2) {
    useRitualStore.setState({
      currentRound: 2,
      isSecondRoundPrep: extras.isSecondRoundPrep ?? false,
    });
  }
  if (extras.reflection?.trim()) {
    store.setReflection(
      extras.reflection,
      extras.openQuestions ?? [],
      extras.followUpExercise ?? null
    );
  }
  if (extras.sessionExerciseId?.trim()) {
    useRitualStore.setState({ sessionExerciseId: extras.sessionExerciseId });
  }
}
