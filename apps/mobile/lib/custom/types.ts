import type { ExperienceMode } from "@/lib/experience/types";

export interface CustomSessionConfig {
  theme: string;
  emotion: string;
  goal: string;
  technique: string;
  depth: ExperienceMode;
}

export const EMPTY_CUSTOM_SESSION_CONFIG: CustomSessionConfig = {
  theme: "",
  emotion: "",
  goal: "",
  technique: "",
  depth: "express",
};

export const CUSTOM_THEMES = [
  "Confiance en soi",
  "Lâcher-prise",
  "Stress",
  "Ancrage",
  "Créativité",
  "Relation",
  "Deuil",
  "Transition",
] as const;

export const CUSTOM_EMOTIONS = [
  "Colère",
  "Tristesse",
  "Peur",
  "Joie",
  "Épuisement",
  "Calme",
  "Frustration",
  "Nostalgie",
] as const;

export const CUSTOM_GOALS = [
  "Extérioriser",
  "Apaiser",
  "Transformer",
  "Explorer",
] as const;

export type TechniqueCategoryId = "visual" | "dance" | "theatre" | "music";

export interface TechniqueCategoryOption {
  id: TechniqueCategoryId;
  label: string;
}

export const CUSTOM_TECHNIQUE_CATEGORIES: TechniqueCategoryOption[] = [
  { id: "visual", label: "Arts Visuels" },
  { id: "dance", label: "Danse / Corps" },
  { id: "theatre", label: "Théâtre / Voix" },
  { id: "music", label: "Musique / Audio" },
];

export function isCustomSessionComplete(
  config: CustomSessionConfig
): config is CustomSessionConfig & {
  theme: string;
  emotion: string;
  goal: string;
  technique: TechniqueCategoryId;
} {
  return (
    config.theme.length > 0 &&
    config.emotion.length > 0 &&
    config.goal.length > 0 &&
    config.technique.length > 0
  );
}
