import type { ImageSourcePropType } from "react-native";

export type ExampleStepId = "impulsion" | "exercice" | "creation" | "reflexion";

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
