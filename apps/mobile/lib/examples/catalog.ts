import {
  EXAMPLE_001_ASSETS,
  EXAMPLE_002_ASSETS,
  EXAMPLE_004_ASSETS,
} from "@/lib/examples/assets";
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

export const EXEMPLE_002: PastekExample = {
  slug: "exemple-002",
  title: "Village italien au lac de Côme",
  subtitle:
    "De l'impulsion « bleu vert, un village en Italie style bord du lac de Côme » au miroir créatif",
  seoTitle:
    "Exemple d'exercice d'art-thérapie en peinture — village italien bleu-vert au lac de Côme | Pastek Art",
  seoDescription:
    "Parcours profond Pastek Art : impulsion lac de Côme, consigne IA, ancrage émotionnel, aquarelle avec citronnier et réflexion bienveillante. Exemple concret du mode profond pour la peinture et le lâcher-prise.",
  canonicalPath: "/exemples/exemple-002",
  technique: "Peinture",
  durationMinutes: 30,
  experienceMode: "deep",
  impulse: "bleu vert, un village en Italie style bord du lac de Côme",
  keywords: ["lumière bleu-verte", "village italien", "air doux"],
  publishedAt: "2026-07-05",
  heroImage: EXAMPLE_002_ASSETS.artwork,
  heroImageAlt:
    "Aquarelle d'un village coloré au bord d'un lac turquoise, citronnier au premier plan et montagnes vertes — création issue d'un exercice d'art-thérapie",
  steps: [
    {
      id: "impulsion",
      title: "1. L'impulsion",
      intro:
        "Le rituel démarre par une image intérieure : bleu vert, un village en Italie, l'air doux du bord du lac de Côme. Pas de croquis imposé — seulement une atmosphère à laisser émerger.",
      body: "bleu vert, un village en Italie style bord du lac de Côme",
      chips: ["Technique : Peinture", "30 minutes", "Parcours profond"],
    },
    {
      id: "exercice",
      title: "2. La consigne générée",
      intro:
        "Le générateur propose une consigne d'environ 120 mots, avec des mots-clés à garder sous les yeux. En mode profond, trois questions d'ancrage viennent ensuite préparer la réflexion bienveillante — sans jugement.",
      body: `Commencez par imaginer la lumière réfléchie sur l'eau du lac de Côme. Quels détails vous viennent à l'esprit en pensant aux couleurs bleu-vert de l'eau ? Prenez un pinceau et peignez le village italien aux toits rouges et aux ruelles étroites. Laissez-vous guider par votre intuition et permettez-vous d'expérimenter avec les couleurs. N'ayez pas peur de faire des erreurs, l'important est de laisser votre créativité s'exprimer sans chercher la perfection.

Avant de partager votre création, ancrez ce que vous avez vécu :

Ressenti émotionnel — Liberté, lâcher-prise.

Le point d'ancrage — Le citronnier n'était pas prévu. À ce moment-là j'ai décidé d'utiliser d'autres médiums : des marqueurs acryliques et des feutres à pointe soft type calligraphie.

L'état physique — Plus détendue. Même si je n'aime pas trop le résultat, j'ai pris le temps de me relaxer et de lâcher prise. Mentalement et physiquement plus calme qu'avant de commencer.`,
      chips: [
        "Technique : Peinture",
        "lumière bleu-verte",
        "village italien",
        "air doux",
      ],
    },
    {
      id: "creation",
      title: "3. La création",
      intro:
        "Pendant les 30 minutes choisies, l'exercice se poursuit même quand le résultat surprend. Ici, l'aquarelle mêle lac turquoise, village aux toits colorés, citronnier imprévu au premier plan — une interprétation libre, enrichie de marqueurs et feutres.",
      image: EXAMPLE_002_ASSETS.artwork,
      imageAlt:
        "Aquarelle : lac turquoise, village italien aux toits rouges, citronnier vert au premier plan et montagnes en arrière-plan",
    },
    {
      id: "reflexion",
      title: "4. Le miroir créatif",
      intro:
        "Après la capture, l'IA propose un miroir créatif : elle accueille ce qui est visible — couleurs, geste, médiums — en s'appuyant sur les mots d'ancrage, puis ouvre des questions pour prolonger l'intégration.",
      body: `Votre paysage respire une lumière bleu-vertée, comme celle du lac de Côme : l'eau turquoise accueille le village aux toits colorés, tandis que les montagnes adoucissent l'horizon. Le citronnier au premier plan — peut-être imprévu — apporte une présence vivante qui ancre la scène dans le présent.

Vous mentionnez avoir exploré d'autres médiums au fil du geste : marqueurs acryliques et feutres à pointe soft. Ces choix témoignent d'une liberté créative, d'un lâcher-prise qui vous a permis de suivre l'élan plutôt que la consigne à la lettre.

Au-delà du résultat, ce qui ressort c'est un état plus détendu — mental et physique — comme si le temps de peindre avait offert un espace de respiration. L'important n'est pas « réussir » l'image, mais ce que vous avez traversé en la faisant.`,
      openQuestions: [
        "Comment vous sentez-vous maintenant, après avoir créé ce paysage ?",
        "Qu'est-ce que vous cherchez à exprimer à travers votre art ?",
        "Quels souvenirs ou émotions vous font référence en regardant ce paysage ?",
      ],
      followUpExercise:
        "Revenez à votre paysage et ajoutez un détail que vous n'aviez pas prévu — un oiseau, une barque, une lumière différente — en laissant encore une fois votre main décider, sans repasser en revue le « résultat ».",
    },
  ],
  outro:
    "Cet exemple illustre le parcours profond Pastek Art : impulsion, consigne personnalisée, ancrage émotionnel, création chronométrée et réflexion qui tient compte de votre vécu — pas seulement de l'image. Lancez votre propre rituel avec vos couleurs et votre rythme.",
};

export const EXEMPLE_004: PastekExample = {
  slug: "exemple-004",
  title: "Couleur pourpre et inquiétude",
  subtitle:
    "De l'impulsion « couleur pourpre, inquiet » au miroir créatif",
  seoTitle:
    "Exemple d'exercice d'art-thérapie en peinture — couleur pourpre et émotion d'inquiétude | Pastek Art",
  seoDescription:
    "Parcours express Pastek Art : impulsion pourpre et inquiétude, consigne IA, peinture expressive en 15 minutes et réflexion bienveillante. Exemple concret pour exprimer et apaiser une émotion par la création.",
  canonicalPath: "/exemples/exemple-004",
  technique: "Peinture",
  durationMinutes: 15,
  experienceMode: "express",
  impulse: "couleur pourpre, inquiet",
  keywords: ["calme intérieur", "libération", "sécurité"],
  publishedAt: "2026-07-05",
  heroImage: EXAMPLE_004_ASSETS.artwork,
  heroImageAlt:
    "Peinture expressive : fond pourpre et rose, lignes noires horizontales, soleils jaunes et rouges — création issue d'un exercice d'art-thérapie",
  steps: [
    {
      id: "impulsion",
      title: "1. L'impulsion",
      intro:
        "Le rituel démarre par une couleur et une émotion : pourpre et inquiétude. Pas de sujet imposé — seulement ce qui est là, maintenant, prêt à être accueilli par le geste.",
      body: "couleur pourpre, inquiet",
      chips: ["Technique : Peinture", "15 minutes", "Parcours express"],
    },
    {
      id: "exercice",
      title: "2. La consigne générée",
      intro:
        "Le générateur transforme l'impulsion en exercice guidé (environ 120 mots), avec des mots-clés à garder sous les yeux pendant la création.",
      body: `Commencez par couvrir une grande partie de la toile avec de la couleur pourpre. Envisagez ce qui vous inquiète en ce moment, et représentez-le avec des traits noirs et sombres, sur un fond de pourpre. Puis, laissez votre esprit se libérer et ajoutez des éléments qui vous apportent calme et sécurité, tels que des fleurs ou des oiseaux, en utilisant des couleurs vives et lumineuses. Explorez la relation entre la couleur pourpre et votre sentiment d'inquiétude.`,
      chips: [
        "Technique : Peinture",
        "calme intérieur",
        "libération",
        "sécurité",
      ],
    },
    {
      id: "creation",
      title: "3. La création",
      intro:
        "Pendant les 15 minutes choisies, l'exercice se poursuit même quand l'image surprend. Ici, un fond rose-pourpre structuré de lignes noires, des formes sombres et des soleils jaunes et rouges — une interprétation libre, directe et expressive.",
      image: EXAMPLE_004_ASSETS.artwork,
      imageAlt:
        "Peinture : champ rose-pourpre traversé de lignes noires horizontales, formes sombres et soleils jaunes et rouges en haut de la feuille",
    },
    {
      id: "reflexion",
      title: "4. Le miroir créatif",
      intro:
        "Après la capture, l'IA propose un miroir créatif : elle accueille ce qui est visible — couleurs, geste, contrastes — puis ouvre des questions pour prolonger l'intégration.",
      body: `Vous avez créé un paysage vibrant, avec des couleurs qui rivalisent entre pourpre, jaune et rouge. Des cercles et des lignes horizontales se croisent, créant une atmosphère abstraite et dynamique. La présence de lignes noires et sombres évoque un sentiment d'inquiétude, mais cela est contrasté par des traits vifs et lumineux qui apportent un sentiment de positivité. La texture rugueuse des couleurs roses ajoute une touche tactile à votre œuvre.

La manière dont vous avez associé la couleur pourpre à votre sentiment d'inquiétude est fascinante. La pourpre, une couleur qui évoque souvent la passion et la créativité, est ici utilisée pour exprimer une émotion plus sombre. Cela nous montre que la couleur peut avoir des connotations différentes pour chacun de nous, et qu'elle peut être utilisée pour exprimer une gamme de sentiments.

Vos couleurs vives et lumineuses évoquent un sentiment de calme et de sécurité, bien au contraire de l'inquiétude que vous aviez exprimée à l'origine. Cela montre comment notre esprit peut se libérer et trouver des solutions à travers la créativité. La présence de fleurs et d'oiseaux dans votre œuvre est également un rappel de la beauté et de la positivité qui peuvent être présentes même dans les moments difficiles.

Encouragez-vous donc à continuer à explorer vos émotions et à les exprimer de manière créative. Votre geste est un pont vers votre âme, et il peut vous aider à trouver des solutions et à vous sentir mieux.`,
      openQuestions: [
        "Qu'est-ce qui vous a inspiré à associer la couleur pourpre à votre sentiment d'inquiétude ?",
        "Comment vous sentez-vous maintenant que vous avez exprimé ces émotions ?",
        "Qu'est-ce que vous avez appris de cette expérience et comment pouvez-vous l'appliquer à votre vie quotidienne ?",
      ],
      followUpExercise:
        "Envisagez maintenant de créer un tableau qui représente un moment de calme et de sécurité. Utilisez des couleurs vives et lumineuses pour exprimer ce sentiment, et explorez la relation entre la couleur et votre émotion.",
    },
  ],
  outro:
    "Cet exemple montre le parcours express Pastek Art : une impulsion émotionnelle, une consigne sur mesure, un temps de création chronométré, puis une réflexion qui accueille l'œuvre telle qu'elle est — y compris ses contrastes. Lancez votre propre rituel avec vos couleurs et votre rythme.",
};

export const PASTEK_EXAMPLES: PastekExample[] = [
  EXEMPLE_001,
  EXEMPLE_002,
  EXEMPLE_004,
].sort((a, b) => {
  const byDate = b.publishedAt.localeCompare(a.publishedAt);
  if (byDate !== 0) return byDate;
  return b.slug.localeCompare(a.slug);
});

export function getExampleBySlug(slug: string): PastekExample | undefined {
  return PASTEK_EXAMPLES.find((e) => e.slug === slug);
}
