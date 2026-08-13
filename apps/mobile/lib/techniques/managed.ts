import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ARTISTIC_TECHNIQUES,
  TECHNIQUE_LABELS,
  isAiAnalysisSupported,
  type ArtisticTechnique,
} from "@art-therapie/shared";
import type { TechniqueDefinition } from "@/constants";
import i18n from "@/lib/i18n";

const STORAGE_KEY = "@art_therapie/managed_techniques_v1";

export interface CustomTechnique {
  id: string;
  label: string;
  /** Technique de base pour les appels API. */
  mapsTo: ArtisticTechnique;
  enabled: boolean;
  aiAnalysis: boolean;
}

export interface ManagedTechniquesState {
  /** IDs built-in désactivés. */
  disabledBuiltin: ArtisticTechnique[];
  custom: CustomTechnique[];
}

const EMPTY: ManagedTechniquesState = {
  disabledBuiltin: [],
  custom: [],
};

function isBuiltinId(id: string): id is ArtisticTechnique {
  return (ARTISTIC_TECHNIQUES as readonly string[]).includes(id);
}

export async function getManagedTechniquesState(): Promise<ManagedTechniquesState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, custom: [] };
    const parsed = JSON.parse(raw) as ManagedTechniquesState;
    return {
      disabledBuiltin: Array.isArray(parsed.disabledBuiltin)
        ? parsed.disabledBuiltin.filter(isBuiltinId)
        : [],
      custom: Array.isArray(parsed.custom)
        ? parsed.custom.filter(
            (c) =>
              typeof c?.id === "string" &&
              c.id.startsWith("custom_") &&
              typeof c.label === "string" &&
              isBuiltinId(c.mapsTo)
          )
        : [],
    };
  } catch {
    return { ...EMPTY, custom: [] };
  }
}

async function saveState(state: ManagedTechniquesState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function buildPickerTechniques(
  state: ManagedTechniquesState
): TechniqueDefinition[] {
  const builtin = ARTISTIC_TECHNIQUES.filter(
    (id) => !state.disabledBuiltin.includes(id)
  ).map((id) => ({
    id,
    label: TECHNIQUE_LABELS[id],
    aiAnalysis: isAiAnalysisSupported(id),
  }));

  const custom = state.custom
    .filter((c) => c.enabled)
    .map((c) => ({
      id: c.mapsTo,
      label: c.label,
      aiAnalysis: c.aiAnalysis,
    }));

  // Dédupliquer par label+id pour le picker (customs mappés sur un built-in)
  const seen = new Set<string>();
  const result: TechniqueDefinition[] = [];
  for (const t of [...builtin, ...custom]) {
    const key = `${t.id}::${t.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
  }
  return result;
}

export async function getEnabledTechniques(): Promise<TechniqueDefinition[]> {
  return buildPickerTechniques(await getManagedTechniquesState());
}

/** Hook : techniques actives pour les pickers. */
export function useEnabledTechniques(): TechniqueDefinition[] {
  const [techniques, setTechniques] = useState<TechniqueDefinition[]>(() =>
    ARTISTIC_TECHNIQUES.map((id) => ({
      id,
      label: TECHNIQUE_LABELS[id],
      aiAnalysis: isAiAnalysisSupported(id),
    }))
  );

  const reload = useCallback(() => {
    void getEnabledTechniques().then(setTechniques);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return techniques;
}

export async function setBuiltinTechniqueEnabled(
  id: ArtisticTechnique,
  enabled: boolean
): Promise<ManagedTechniquesState> {
  const state = await getManagedTechniquesState();
  const disabled = new Set(state.disabledBuiltin);
  if (enabled) disabled.delete(id);
  else disabled.add(id);
  const next = { ...state, disabledBuiltin: [...disabled] };
  await saveState(next);
  return next;
}

export async function addCustomTechnique(input: {
  label: string;
  mapsTo?: ArtisticTechnique;
  aiAnalysis?: boolean;
}): Promise<ManagedTechniquesState> {
  const label = input.label.trim();
  if (label.length < 2) throw new Error(i18n.t("common:techniques.nameTooShort"));
  const state = await getManagedTechniquesState();
  const mapsTo = input.mapsTo ?? "mixed_media";
  const custom: CustomTechnique = {
    id: `custom_${Date.now().toString(36)}`,
    label,
    mapsTo,
    enabled: true,
    aiAnalysis:
      input.aiAnalysis ?? isAiAnalysisSupported(mapsTo),
  };
  const next = { ...state, custom: [...state.custom, custom] };
  await saveState(next);
  return next;
}

export async function setCustomTechniqueEnabled(
  id: string,
  enabled: boolean
): Promise<ManagedTechniquesState> {
  const state = await getManagedTechniquesState();
  const next = {
    ...state,
    custom: state.custom.map((c) =>
      c.id === id ? { ...c, enabled } : c
    ),
  };
  await saveState(next);
  return next;
}

export async function deleteCustomTechnique(
  id: string
): Promise<ManagedTechniquesState> {
  if (!id.startsWith("custom_")) {
    throw new Error(i18n.t("common:techniques.cannotDeleteBuiltIn"));
  }
  const state = await getManagedTechniquesState();
  const next = {
    ...state,
    custom: state.custom.filter((c) => c.id !== id),
  };
  await saveState(next);
  return next;
}
