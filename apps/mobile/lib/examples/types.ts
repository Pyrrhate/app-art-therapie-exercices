import type { ImageSourcePropType } from "react-native";
import type { AppLanguage } from "@/lib/i18n/types";

export type ExampleStepId = "impulsion" | "exercice" | "creation" | "reflexion";

/** Texte disponible dans chaque langue de l'interface. */
export type LocalizedText = Record<AppLanguage, string>;
export type LocalizedList = Record<AppLanguage, string[]>;

export interface ExampleStep {
  id: ExampleStepId;
  title: string;
  /** Texte SEO / pédagogique autour de l'étape */
  intro: string;
  /** Contenu principal (consigne, réflexion, etc.) */
  body?: string;
  /** Mots-clés ou métadonnées affichées en chips */
  chips?: string[];
  image?: ImageSourcePropType;
  imageAlt?: string;
  /** Questions ouvertes (étape réflexion) */
  openQuestions?: string[];
  followUpExercise?: string;
}

export interface PastekExample {
  slug: string;
  title: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  technique: string;
  durationMinutes: number;
  experienceMode: "express" | "deep";
  impulse: string;
  keywords: string[];
  publishedAt: string;
  heroImage?: ImageSourcePropType;
  heroImageAlt?: string;
  steps: ExampleStep[];
  /** Paragraphe de conclusion + CTA context */
  outro: string;
}

/** Entrée de catalogue : le contenu éditorial existe en FR et EN (SEO bilingue). */
export interface LocalizedExampleStep {
  id: ExampleStepId;
  title: LocalizedText;
  intro: LocalizedText;
  body?: LocalizedText;
  chips?: LocalizedList;
  image?: ImageSourcePropType;
  imageAlt?: LocalizedText;
  openQuestions?: LocalizedList;
  followUpExercise?: LocalizedText;
}

export interface LocalizedPastekExample {
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  seoTitle: LocalizedText;
  seoDescription: LocalizedText;
  canonicalPath: string;
  technique: LocalizedText;
  durationMinutes: number;
  experienceMode: "express" | "deep";
  impulse: LocalizedText;
  keywords: LocalizedList;
  publishedAt: string;
  heroImage?: ImageSourcePropType;
  heroImageAlt?: LocalizedText;
  steps: LocalizedExampleStep[];
  outro: LocalizedText;
}
