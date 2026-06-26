import { EXAMPLE_001_ASSETS } from "@/lib/examples/assets";
import type { PastekExample } from "@/lib/examples/types";

export const EXEMPLE_001: PastekExample = {
  slug: "exemple-001",
  title: "Paysage chaud en peinture",
  subtitle: "De l'impulsion « rose beige avec accent fuchsia et vert » au miroir créatif",
  seoTitle:
    "Exemple d'exercice d'art-thérapie en peinture — paysage rose-beige et fuchsia | Pastek Art",
  seoDescription:
    "Découvrez un parcours complet : impulsion couleur, consigne IA personnalisée, création à l'aquarelle et réflexion bienveillante. Exemple concret du générateur Pastek Art pour la peinture et le lâcher-prise.",
  canonicalPath: "/exemples/exemple-001",
  technique: "Peinture",
  durationMinutes: 15,
  experienceMode: "express",
  impulse: "rose beige avec accent fuchsia et vert",
  keywords: ["atmosphère chaude", "rosée légère", "couleurs douces"],
  publishedAt: "2026-06-24",
  heroImage: EXAMPLE_001_ASSETS.artwork,
  heroImageAlt:
    "Aquarelle d'un paysage au ciel rose, montagnes violettes et herbes vertes — création issue d'un exercice d'art-thérapie",
  steps: [
    {
      id: "impulsion",
      title: "1. L'impulsion",
      intro:
        "Tout rituel Pastek Art commence par un mot, une couleur ou une sensation. Ici, l'utilisatrice choisit une palette douce : rose beige, touches de fuchsia et de vert — sans viser un sujet précis, juste une atmosphère.",
      body: "rose beige avec accent fuchsia et vert",
      chips: ["Technique : Peinture", "15 minutes", "Parcours express"],
    },
    {
      id: "exercice",
      title: "2. La consigne générée",
      intro:
        "Le générateur transforme l'impulsion en exercice guidé (environ 120 mots), avec des mots-clés à garder sous les yeux pendant la création.",
      body: `Commencez par créer un paysage chaud et calme. Imaginez une rosée légère tombant sur des fleurs rose-beige. Ajoutez des accents fuchsia pour un peu de vibrance. Enfin, ajoutez des feuilles vertes pour une touche de nature.

Peignez cette atmosphère en utilisant des couleurs douces et des touches de lumière. Laissez votre pinceau s'exprimer et laissez la créativité se déployer.`,
      chips: [
        "Technique : Peinture",
        "atmosphère chaude",
        "rosée légère",
        "couleurs douces",
      ],
    },
    {
      id: "creation",
      title: "3. La création",
      intro:
        "Pendant le temps choisi (ici 15 minutes), l'exercice continue même dans le doute. Voici une réalisation à l'aquarelle : ciel rose, eau calme, végétation verte — une interprétation libre de l'atmosphère demandée.",
      image: EXAMPLE_001_ASSETS.artwork,
      imageAlt:
        "Aquarelle : paysage au coucher de soleil rose, montagnes lilas et touffes d'herbe verte en premier plan",
    },
    {
      id: "reflexion",
      title: "4. Le miroir créatif",
      intro:
        "Après la création, une photo est envoyée à l'IA (analyse bienveillante, sans jugement). Le « miroir créatif » accueille ce qui est réellement visible — couleurs, geste, ambiance — puis propose des questions et parfois un exercice de suite.",
      body: `Vous avez offert à ce moment un paysage chaleureux, où les teintes rose-beige et fuchsia se répondent avec douceur. Des bandes verticales violettes structurent l'espace comme des nuages empilés ; le vert des feuilles apporte une respiration naturelle.

L'atmosphère reste calme et enveloppante : on sent la lumière filtrer sans violence, une sorte de sérénité après le geste. Votre main a laissé des traces de pinceau visibles — signe d'un rythme posé, curieux, sans chercher la perfection.

Ce que vous montrez, c'est moins une illustration exacte d'une consigne que une présence colorée : chaleur, douceur, un peu de vibrance là où le fuchsia réveille le rose.`,
      openQuestions: [
        "Qu'est-ce qui vous a le plus apaisé pendant ces quinze minutes ?",
        "Où sentez-vous encore la chaleur de ce rose-beige dans votre corps ?",
        "Si cette scène pouvait vous dire une phrase, laquelle serait-ce ?",
      ],
      followUpExercise:
        "Essayez d'ajouter quelques oiseaux à votre paysage : laissez-les prendre place dans le vert et près des touches rose-beige, sans viser un dessin « réussi » — seulement un mouvement léger qui prolonge la scène.",
    },
  ],
  outro:
    "Cet exemple montre le parcours type Pastek Art : une impulsion simple, une consigne sur mesure, un temps de création chronométré, puis une réflexion qui accueille l'œuvre telle qu'elle est. Vous pouvez reproduire ce rituel en quelques clics — avec vos propres couleurs et votre rythme.",
};

export const PASTEK_EXAMPLES: PastekExample[] = [EXEMPLE_001];

export function getExampleBySlug(slug: string): PastekExample | undefined {
  return PASTEK_EXAMPLES.find((e) => e.slug === slug);
}
