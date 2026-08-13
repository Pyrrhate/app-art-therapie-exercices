import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";
import { SEASON_CATALOG } from "./catalog";
import type {
  SeasonDefinition,
  SeasonDuration,
  SeasonRun,
  SeasonsState,
} from "./types";

const EMPTY: SeasonsState = { active: null, history: [] };

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Jour calendaire 1-based depuis le début de la saison. */
export function seasonDayIndex(run: SeasonRun, now = new Date()): number {
  const start = startOfLocalDay(run.startedAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  return diff + 1;
}

export function seasonHasElapsed(run: SeasonRun, now = new Date()): boolean {
  return seasonDayIndex(run, now) > run.durationDays;
}

export function practicedToday(run: SeasonRun, now = new Date()): boolean {
  return run.completedDates.includes(localDateKey(now));
}

export function buildSeasonStatement(run: SeasonRun, now = new Date()): string {
  const day = Math.min(seasonDayIndex(run, now), run.durationDays);
  return `Saison « ${run.title} » — jour ${day}/${run.durationDays}. ${run.constraint}`;
}

async function readState(): Promise<SeasonsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.seasons);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as SeasonsState;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      active: parsed.active ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return EMPTY;
  }
}

async function writeState(state: SeasonsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.seasons, JSON.stringify(state));
}

function closeActive(
  state: SeasonsState,
  status: "completed" | "abandoned"
): SeasonsState {
  if (!state.active) return state;
  const closed: SeasonRun = { ...state.active, status };
  return { active: null, history: [closed, ...state.history].slice(0, 20) };
}

/** Clôture automatique si la fenêtre de jours est dépassée. */
export async function refreshSeasonStatus(): Promise<SeasonRun | null> {
  const state = await readState();
  if (!state.active) return null;
  if (seasonHasElapsed(state.active)) {
    const next = closeActive(state, "completed");
    await writeState(next);
    return null;
  }
  return state.active;
}

export async function getActiveSeasonRun(): Promise<SeasonRun | null> {
  return refreshSeasonStatus();
}

export async function getSeasonsState(): Promise<SeasonsState> {
  const active = await refreshSeasonStatus();
  const state = await readState();
  return { ...state, active };
}

function definitionToRun(def: SeasonDefinition): SeasonRun {
  return {
    id: `${Date.now()}-${def.id}`,
    catalogId: def.id,
    title: def.title,
    constraint: def.constraint,
    durationDays: def.durationDays,
    kind: def.kind,
    startedAt: new Date().toISOString(),
    completedDates: [],
    status: "active",
    suggestedTechnique: def.suggestedTechnique,
    suggestedImpulse: def.suggestedImpulse,
  };
}

export async function startCatalogSeason(
  catalogId: string
): Promise<SeasonRun> {
  const def = SEASON_CATALOG.find((s) => s.id === catalogId);
  if (!def) throw new Error("Saison introuvable");
  const state = await readState();
  let next = state;
  if (state.active) {
    next = closeActive(state, "abandoned");
  }
  const run = definitionToRun(def);
  await writeState({ active: run, history: next.history });
  return run;
}

export async function startCustomSeason(input: {
  title: string;
  constraint: string;
  durationDays: SeasonDuration;
  suggestedTechnique?: ArtisticTechnique;
}): Promise<SeasonRun> {
  const title = input.title.trim().slice(0, 48) || "Ma saison";
  const constraint = input.constraint.trim().slice(0, 280);
  if (constraint.length < 8) {
    throw new Error("Écrivez une contrainte d'au moins quelques mots.");
  }
  const state = await readState();
  let next = state;
  if (state.active) {
    next = closeActive(state, "abandoned");
  }
  const run: SeasonRun = {
    id: `${Date.now()}-custom`,
    catalogId: "custom",
    title,
    constraint,
    durationDays: input.durationDays,
    kind: "custom",
    startedAt: new Date().toISOString(),
    completedDates: [],
    status: "active",
    suggestedTechnique: input.suggestedTechnique,
    custom: true,
  };
  await writeState({ active: run, history: next.history });
  return run;
}

export async function abandonActiveSeason(): Promise<void> {
  const state = await readState();
  if (!state.active) return;
  await writeState(closeActive(state, "abandoned"));
}

/** Marque aujourd'hui comme pratiqué. Retourne la saison si elle est active. */
export async function noteSeasonPractice(): Promise<SeasonRun | null> {
  const state = await readState();
  if (!state.active) return null;
  if (seasonHasElapsed(state.active)) {
    await writeState(closeActive(state, "completed"));
    return null;
  }
  const today = localDateKey();
  if (state.active.completedDates.includes(today)) {
    return state.active;
  }
  const updated: SeasonRun = {
    ...state.active,
    completedDates: [...state.active.completedDates, today],
  };
  await writeState({ ...state, active: updated });
  return updated;
}
