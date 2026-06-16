import type { RitualDraftStep } from "@/lib/ritualDraft";
import {
  clearRitualDraft,
  saveRitualDraft,
  type RitualDraft,
} from "@/lib/ritualDraft";
import { useRitualStore } from "@/lib/store";

export async function persistRitualDraft(step: RitualDraftStep): Promise<void> {
  const state = useRitualStore.getState();
  if (!state.exercise?.trim() || !state.technique || !state.impulse.trim()) {
    return;
  }

  const draft: RitualDraft = {
    impulse: state.impulse,
    technique: state.technique,
    exercise: state.exercise,
    exerciseKeywords: state.exerciseKeywords,
    durationMinutes: state.durationMinutes,
    step,
    photoUri: state.photoUri,
    writtenText: state.writtenText,
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
    draft.exerciseKeywords
  );
  if (draft.photoUri) store.setPhotoUri(draft.photoUri);
  if (draft.writtenText) store.setWrittenText(draft.writtenText);
}
