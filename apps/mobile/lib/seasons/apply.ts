import { useRitualStore } from "@/lib/store";
import {
  buildSeasonStatement,
  getActiveSeasonRun,
} from "@/lib/seasons/storage";
import type { SeasonRun } from "@/lib/seasons/types";

/** Injecte la contrainte de saison dans le rituel (énoncé visible, pas une directive IA). */
export async function applyActiveSeasonToRitual(options?: {
  preferSuggestedImpulse?: boolean;
}): Promise<SeasonRun | null> {
  const run = await getActiveSeasonRun();
  const store = useRitualStore.getState();
  if (!run) {
    store.setSeason(null, null);
    return null;
  }

  store.setSeason(run.id, run.title);

  const seasonText = buildSeasonStatement(run);
  const existing = store.moduleStatement?.trim();
  if (!existing) {
    store.setModuleStatement(seasonText);
  } else if (!existing.includes(run.title)) {
    store.setModuleStatement(`${existing}\n\n${seasonText}`);
  }

  if (run.suggestedTechnique && !store.technique) {
    store.setTechnique(run.suggestedTechnique);
  }

  if (
    run.suggestedImpulse &&
    (options?.preferSuggestedImpulse || !store.impulse.trim())
  ) {
    store.setImpulse(run.suggestedImpulse);
  }

  return run;
}
