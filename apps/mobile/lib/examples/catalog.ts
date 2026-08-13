import {
  EXAMPLE_001_ASSETS,
  EXAMPLE_002_ASSETS,
  EXAMPLE_004_ASSETS,
} from "@/lib/examples/assets";
import type {
  LocalizedExampleStep,
  LocalizedPastekExample,
  ExampleStep,
  PastekExample,
} from "@/lib/examples/types";
import type { AppLanguage } from "@/lib/i18n/types";

export const EXEMPLE_001: LocalizedPastekExample = {
  slug: "exemple-001",
  title: {
    fr: "Paysage chaud en peinture",
    en: "A warm landscape in paint",
  },
  subtitle: {
    fr: "De l'impulsion « rose beige avec accent fuchsia et vert » au miroir créatif",
    en: "From the impulse “beige pink with fuchsia and green accents” to the creative mirror",
  },
  seoTitle: {
    fr: "Exemple d'exercice créatif en peinture — paysage rose-beige et fuchsia | Pastek Art",
    en: "Example of a creative painting exercise — a beige-pink and fuchsia landscape | Pastek Art",
  },
  seoDescription: {
    fr: "Découvrez un parcours complet : impulsion couleur, consigne IA personnalisée, création à l'aquarelle et réflexion bienveillante. Exemple concret du générateur Pastek Art pour la peinture et le lâcher-prise.",
    en: "Follow a complete journey: a colour impulse, a brief written by the AI, a watercolour made in 15 minutes and a kind reflection. A concrete example of the Pastek Art generator for painting and letting go.",
  },
  canonicalPath: "/exemples/exemple-001",
  technique: { fr: "Peinture", en: "Painting" },
  durationMinutes: 15,
  experienceMode: "express",
  impulse: {
    fr: "rose beige avec accent fuchsia et vert",
    en: "beige pink with fuchsia and green accents",
  },
  keywords: {
    fr: ["atmosphère chaude", "rosée légère", "couleurs douces"],
    en: ["warm atmosphere", "light dew", "soft colours"],
  },
  publishedAt: "2026-06-24",
  heroImage: EXAMPLE_001_ASSETS.artwork,
  heroImageAlt: {
    fr: "Aquarelle d'un paysage au ciel rose, montagnes violettes et herbes vertes — création issue d'un exercice créatif",
    en: "Watercolour of a landscape with a pink sky, purple mountains and green grasses — made during a creative exercise",
  },
  steps: [
    {
      id: "impulsion",
      title: { fr: "1. L'impulsion", en: "1. The impulse" },
      intro: {
        fr: "Tout rituel Pastek Art commence par un mot, une couleur ou une sensation. Ici, l'utilisatrice choisit une palette douce : rose beige, touches de fuchsia et de vert — sans viser un sujet précis, juste une atmosphère.",
        en: "Every Pastek Art ritual starts with a word, a colour or a sensation. Here she picks a soft palette: beige pink, touches of fuchsia and green — no particular subject in mind, just an atmosphere.",
      },
      body: {
        fr: "rose beige avec accent fuchsia et vert",
        en: "beige pink with fuchsia and green accents",
      },
      chips: {
        fr: ["Technique : Peinture", "15 minutes", "Parcours express"],
        en: ["Technique: Painting", "15 minutes", "Express journey"],
      },
    },
    {
      id: "exercice",
      title: { fr: "2. La consigne générée", en: "2. The generated brief" },
      intro: {
        fr: "Le générateur transforme l'impulsion en exercice guidé (environ 120 mots), avec des mots-clés à garder sous les yeux pendant la création.",
        en: "The generator turns the impulse into a guided exercise (around 120 words), with keywords to keep in view while you make.",
      },
      body: {
        fr: `Commencez par créer un paysage chaud et calme. Imaginez une rosée légère tombant sur des fleurs rose-beige. Ajoutez des accents fuchsia pour un peu de vibrance. Enfin, ajoutez des feuilles vertes pour une touche de nature.

Peignez cette atmosphère en utilisant des couleurs douces et des touches de lumière. Laissez votre pinceau s'exprimer et laissez la créativité se déployer.`,
        en: `Start by making a warm, quiet landscape. Picture a light dew settling on beige-pink flowers. Add fuchsia accents for a little vibrance. Then bring in green leaves for a touch of nature.

Paint this atmosphere with soft colours and small touches of light. Let your brush speak, and let the creativity unfold.`,
      },
      chips: {
        fr: [
          "Technique : Peinture",
          "atmosphère chaude",
          "rosée légère",
          "couleurs douces",
        ],
        en: [
          "Technique: Painting",
          "warm atmosphere",
          "light dew",
          "soft colours",
        ],
      },
    },
    {
      id: "creation",
      title: { fr: "3. La création", en: "3. The making" },
      intro: {
        fr: "Pendant le temps choisi (ici 15 minutes), l'exercice continue même dans le doute. Voici une réalisation à l'aquarelle : ciel rose, eau calme, végétation verte — une interprétation libre de l'atmosphère demandée.",
        en: "For the time you chose (15 minutes here), the exercise keeps going even through the doubt. Here is a watercolour: pink sky, still water, green growth — a free reading of the atmosphere asked for.",
      },
      image: EXAMPLE_001_ASSETS.artwork,
      imageAlt: {
        fr: "Aquarelle : paysage au coucher de soleil rose, montagnes lilas et touffes d'herbe verte en premier plan",
        en: "Watercolour: a landscape at pink sunset, lilac mountains and tufts of green grass in the foreground",
      },
    },
    {
      id: "reflexion",
      title: { fr: "4. Le miroir créatif", en: "4. The creative mirror" },
      intro: {
        fr: "Après la création, une photo est envoyée à l'IA (analyse bienveillante, sans jugement). Le « miroir créatif » accueille ce qui est réellement visible — couleurs, geste, ambiance — puis propose des questions et parfois un exercice de suite.",
        en: "Once the making is done, a photo goes to the AI (a kind reading, with no judgement). The “creative mirror” welcomes what is actually there — colours, gesture, mood — then offers questions and sometimes a follow-up exercise.",
      },
      body: {
        fr: `Vous avez offert à ce moment un paysage chaleureux, où les teintes rose-beige et fuchsia se répondent avec douceur. Des bandes verticales violettes structurent l'espace comme des nuages empilés ; le vert des feuilles apporte une respiration naturelle.

L'atmosphère reste calme et enveloppante : on sent la lumière filtrer sans violence, une sorte de sérénité après le geste. Votre main a laissé des traces de pinceau visibles — signe d'un rythme posé, curieux, sans chercher la perfection.

Ce que vous montrez, c'est moins une illustration exacte d'une consigne que une présence colorée : chaleur, douceur, un peu de vibrance là où le fuchsia réveille le rose.`,
        en: `You gave this moment a warm landscape, where beige-pink and fuchsia answer each other gently. Vertical purple bands hold the space like stacked clouds; the green of the leaves brings a natural breath.

The mood stays calm and enveloping: the light filters through without harshness, a kind of serenity after the gesture. Your hand left visible brush marks — the sign of a steady, curious rhythm, not chasing perfection.

What you show is less an exact illustration of a brief than a coloured presence: warmth, softness, and a little vibrance where the fuchsia wakes up the pink.`,
      },
      openQuestions: {
        fr: [
          "Qu'est-ce qui vous a le plus apaisé pendant ces quinze minutes ?",
          "Où sentez-vous encore la chaleur de ce rose-beige dans votre corps ?",
          "Si cette scène pouvait vous dire une phrase, laquelle serait-ce ?",
        ],
        en: [
          "What settled you most during those fifteen minutes?",
          "Where do you still feel the warmth of that beige pink in your body?",
          "If this scene could say one sentence to you, what would it be?",
        ],
      },
      followUpExercise: {
        fr: "Essayez d'ajouter quelques oiseaux à votre paysage : laissez-les prendre place dans le vert et près des touches rose-beige, sans viser un dessin « réussi » — seulement un mouvement léger qui prolonge la scène.",
        en: "Try adding a few birds to your landscape: let them settle into the green and near the beige-pink touches, without aiming for a “good” drawing — just a light movement that carries the scene a little further.",
      },
    },
  ],
  outro: {
    fr: "Cet exemple montre le parcours type Pastek Art : une impulsion simple, une consigne sur mesure, un temps de création chronométré, puis une réflexion qui accueille l'œuvre telle qu'elle est. Vous pouvez reproduire ce rituel en quelques clics — avec vos propres couleurs et votre rythme.",
    en: "This example shows the typical Pastek Art journey: a simple impulse, a brief made for you, a timed stretch of making, then a reflection that welcomes the work exactly as it is. You can run this ritual in a few clicks — with your own colours and your own pace.",
  },
};

export const EXEMPLE_002: LocalizedPastekExample = {
  slug: "exemple-002",
  title: {
    fr: "Village italien au lac de Côme",
    en: "An Italian village on Lake Como",
  },
  subtitle: {
    fr: "De l'impulsion « bleu vert, un village en Italie style bord du lac de Côme » au miroir créatif",
    en: "From the impulse “blue-green, an Italian village on the shores of Lake Como” to the creative mirror",
  },
  seoTitle: {
    fr: "Exemple d'exercice créatif en peinture — village italien bleu-vert au lac de Côme | Pastek Art",
    en: "Example of a creative painting exercise — a blue-green Italian village on Lake Como | Pastek Art",
  },
  seoDescription: {
    fr: "Parcours profond Pastek Art : impulsion lac de Côme, consigne IA, ancrage émotionnel, aquarelle avec citronnier et réflexion bienveillante. Exemple concret du mode profond pour la peinture et le lâcher-prise.",
    en: "A deep Pastek Art journey: a Lake Como impulse, an AI brief, emotional grounding, a watercolour with a lemon tree and a kind reflection. A concrete example of deep mode for painting and letting go.",
  },
  canonicalPath: "/exemples/exemple-002",
  technique: { fr: "Peinture", en: "Painting" },
  durationMinutes: 30,
  experienceMode: "deep",
  impulse: {
    fr: "bleu vert, un village en Italie style bord du lac de Côme",
    en: "blue-green, an Italian village on the shores of Lake Como",
  },
  keywords: {
    fr: ["lumière bleu-verte", "village italien", "air doux"],
    en: ["blue-green light", "Italian village", "soft air"],
  },
  publishedAt: "2026-07-05",
  heroImage: EXAMPLE_002_ASSETS.artwork,
  heroImageAlt: {
    fr: "Aquarelle d'un village coloré au bord d'un lac turquoise, citronnier au premier plan et montagnes vertes — création issue d'un exercice créatif",
    en: "Watercolour of a colourful village beside a turquoise lake, a lemon tree in the foreground and green mountains — made during a creative exercise",
  },
  steps: [
    {
      id: "impulsion",
      title: { fr: "1. L'impulsion", en: "1. The impulse" },
      intro: {
        fr: "Le rituel démarre par une image intérieure : bleu vert, un village en Italie, l'air doux du bord du lac de Côme. Pas de croquis imposé — seulement une atmosphère à laisser émerger.",
        en: "The ritual starts with an inner image: blue-green, an Italian village, the soft air on the shores of Lake Como. No sketch imposed — only an atmosphere allowed to surface.",
      },
      body: {
        fr: "bleu vert, un village en Italie style bord du lac de Côme",
        en: "blue-green, an Italian village on the shores of Lake Como",
      },
      chips: {
        fr: ["Technique : Peinture", "30 minutes", "Parcours profond"],
        en: ["Technique: Painting", "30 minutes", "Deep journey"],
      },
    },
    {
      id: "exercice",
      title: { fr: "2. La consigne générée", en: "2. The generated brief" },
      intro: {
        fr: "Le générateur propose une consigne d'environ 120 mots, avec des mots-clés à garder sous les yeux. En mode profond, trois questions d'ancrage viennent ensuite préparer la réflexion bienveillante — sans jugement.",
        en: "The generator offers a brief of about 120 words, with keywords to keep in view. In deep mode, three grounding questions then prepare the kind reflection — with no judgement.",
      },
      body: {
        fr: `Commencez par imaginer la lumière réfléchie sur l'eau du lac de Côme. Quels détails vous viennent à l'esprit en pensant aux couleurs bleu-vert de l'eau ? Prenez un pinceau et peignez le village italien aux toits rouges et aux ruelles étroites. Laissez-vous guider par votre intuition et permettez-vous d'expérimenter avec les couleurs. N'ayez pas peur de faire des erreurs, l'important est de laisser votre créativité s'exprimer sans chercher la perfection.

Avant de partager votre création, ancrez ce que vous avez vécu :

Ressenti émotionnel — Liberté, lâcher-prise.

Le point d'ancrage — Le citronnier n'était pas prévu. À ce moment-là j'ai décidé d'utiliser d'autres médiums : des marqueurs acryliques et des feutres à pointe soft type calligraphie.

L'état physique — Plus détendue. Même si je n'aime pas trop le résultat, j'ai pris le temps de me relaxer et de lâcher prise. Mentalement et physiquement plus calme qu'avant de commencer.`,
        en: `Start by imagining the light reflected on the water of Lake Como. What details come to mind when you think of the blue-green of the water? Pick up a brush and paint the Italian village with its red roofs and narrow lanes. Let your intuition lead and allow yourself to experiment with the colours. Don't be afraid of mistakes — what matters is letting your creativity speak without chasing perfection.

Before sharing your work, ground what you have just been through:

How it felt — Freedom, letting go.

The turning point — The lemon tree wasn't planned. At that moment I decided to use other media: acrylic markers and soft-tip calligraphy pens.

Physically — More relaxed. Even though I'm not that keen on the result, I took the time to unwind and let go. Calmer in body and mind than before I began.`,
      },
      chips: {
        fr: [
          "Technique : Peinture",
          "lumière bleu-verte",
          "village italien",
          "air doux",
        ],
        en: [
          "Technique: Painting",
          "blue-green light",
          "Italian village",
          "soft air",
        ],
      },
    },
    {
      id: "creation",
      title: { fr: "3. La création", en: "3. The making" },
      intro: {
        fr: "Pendant les 30 minutes choisies, l'exercice se poursuit même quand le résultat surprend. Ici, l'aquarelle mêle lac turquoise, village aux toits colorés, citronnier imprévu au premier plan — une interprétation libre, enrichie de marqueurs et feutres.",
        en: "Across the 30 minutes chosen, the exercise carries on even when the result surprises. Here the watercolour blends a turquoise lake, a village of coloured roofs and an unplanned lemon tree in the foreground — a free reading, enriched with markers and pens.",
      },
      image: EXAMPLE_002_ASSETS.artwork,
      imageAlt: {
        fr: "Aquarelle : lac turquoise, village italien aux toits rouges, citronnier vert au premier plan et montagnes en arrière-plan",
        en: "Watercolour: a turquoise lake, an Italian village with red roofs, a green lemon tree in the foreground and mountains behind",
      },
    },
    {
      id: "reflexion",
      title: { fr: "4. Le miroir créatif", en: "4. The creative mirror" },
      intro: {
        fr: "Après la capture, l'IA propose un miroir créatif : elle accueille ce qui est visible — couleurs, geste, médiums — en s'appuyant sur les mots d'ancrage, puis ouvre des questions pour prolonger l'intégration.",
        en: "After the photo, the AI offers a creative mirror: it welcomes what is visible — colours, gesture, media — leaning on the grounding words, then opens questions to carry the integration further.",
      },
      body: {
        fr: `Votre paysage respire une lumière bleu-vertée, comme celle du lac de Côme : l'eau turquoise accueille le village aux toits colorés, tandis que les montagnes adoucissent l'horizon. Le citronnier au premier plan — peut-être imprévu — apporte une présence vivante qui ancre la scène dans le présent.

Vous mentionnez avoir exploré d'autres médiums au fil du geste : marqueurs acryliques et feutres à pointe soft. Ces choix témoignent d'une liberté créative, d'un lâcher-prise qui vous a permis de suivre l'élan plutôt que la consigne à la lettre.

Au-delà du résultat, ce qui ressort c'est un état plus détendu — mental et physique — comme si le temps de peindre avait offert un espace de respiration. L'important n'est pas « réussir » l'image, mais ce que vous avez traversé en la faisant.`,
        en: `Your landscape breathes a blue-green light, like the one over Lake Como: the turquoise water holds the village with its coloured roofs, while the mountains soften the horizon. The lemon tree in the foreground — perhaps unplanned — brings a living presence that anchors the scene in the here and now.

You mention exploring other media as the gesture went on: acrylic markers and soft-tip pens. Those choices speak of creative freedom, of a letting go that let you follow the momentum rather than the brief to the letter.

Beyond the result, what stands out is a more relaxed state — in body and mind — as if the time spent painting had opened a space to breathe. What matters is not “getting the image right”, but what you moved through while making it.`,
      },
      openQuestions: {
        fr: [
          "Comment vous sentez-vous maintenant, après avoir créé ce paysage ?",
          "Qu'est-ce que vous cherchez à exprimer à travers votre art ?",
          "Quels souvenirs ou émotions vous font référence en regardant ce paysage ?",
        ],
        en: [
          "How do you feel now, having made this landscape?",
          "What are you reaching for through your art?",
          "What memories or feelings come back as you look at this landscape?",
        ],
      },
      followUpExercise: {
        fr: "Revenez à votre paysage et ajoutez un détail que vous n'aviez pas prévu — un oiseau, une barque, une lumière différente — en laissant encore une fois votre main décider, sans repasser en revue le « résultat ».",
        en: "Come back to your landscape and add a detail you hadn't planned — a bird, a small boat, a different light — letting your hand decide once again, without reviewing the “result”.",
      },
    },
  ],
  outro: {
    fr: "Cet exemple illustre le parcours profond Pastek Art : impulsion, consigne personnalisée, ancrage émotionnel, création chronométrée et réflexion qui tient compte de votre vécu — pas seulement de l'image. Lancez votre propre rituel avec vos couleurs et votre rythme.",
    en: "This example shows the deep Pastek Art journey: impulse, a brief made for you, emotional grounding, timed making, and a reflection that takes your experience into account — not only the image. Start your own ritual with your colours and your pace.",
  },
};

export const EXEMPLE_004: LocalizedPastekExample = {
  slug: "exemple-004",
  title: {
    fr: "Couleur pourpre et inquiétude",
    en: "Purple and worry",
  },
  subtitle: {
    fr: "De l'impulsion « couleur pourpre, inquiet » au miroir créatif",
    en: "From the impulse “purple, worried” to the creative mirror",
  },
  seoTitle: {
    fr: "Exemple d'exercice créatif en peinture — couleur pourpre et émotion d'inquiétude | Pastek Art",
    en: "Example of a creative painting exercise — the colour purple and a feeling of worry | Pastek Art",
  },
  seoDescription: {
    fr: "Parcours express Pastek Art : impulsion pourpre et inquiétude, consigne IA, peinture expressive en 15 minutes et réflexion bienveillante. Exemple concret pour exprimer et apaiser une émotion par la création.",
    en: "An express Pastek Art journey: an impulse of purple and worry, an AI brief, expressive painting in 15 minutes and a kind reflection. A concrete example of expressing and easing a feeling through making.",
  },
  canonicalPath: "/exemples/exemple-004",
  technique: { fr: "Peinture", en: "Painting" },
  durationMinutes: 15,
  experienceMode: "express",
  impulse: { fr: "couleur pourpre, inquiet", en: "purple, worried" },
  keywords: {
    fr: ["calme intérieur", "libération", "sécurité"],
    en: ["inner calm", "release", "safety"],
  },
  publishedAt: "2026-07-05",
  heroImage: EXAMPLE_004_ASSETS.artwork,
  heroImageAlt: {
    fr: "Peinture expressive : fond pourpre et rose, lignes noires horizontales, soleils jaunes et rouges — création issue d'un exercice créatif",
    en: "Expressive painting: a purple and pink ground, horizontal black lines, yellow and red suns — made during a creative exercise",
  },
  steps: [
    {
      id: "impulsion",
      title: { fr: "1. L'impulsion", en: "1. The impulse" },
      intro: {
        fr: "Le rituel démarre par une couleur et une émotion : pourpre et inquiétude. Pas de sujet imposé — seulement ce qui est là, maintenant, prêt à être accueilli par le geste.",
        en: "The ritual starts with a colour and a feeling: purple and worry. No subject imposed — only what is here, now, ready to be met by the gesture.",
      },
      body: { fr: "couleur pourpre, inquiet", en: "purple, worried" },
      chips: {
        fr: ["Technique : Peinture", "15 minutes", "Parcours express"],
        en: ["Technique: Painting", "15 minutes", "Express journey"],
      },
    },
    {
      id: "exercice",
      title: { fr: "2. La consigne générée", en: "2. The generated brief" },
      intro: {
        fr: "Le générateur transforme l'impulsion en exercice guidé (environ 120 mots), avec des mots-clés à garder sous les yeux pendant la création.",
        en: "The generator turns the impulse into a guided exercise (around 120 words), with keywords to keep in view while you make.",
      },
      body: {
        fr: `Commencez par couvrir une grande partie de la toile avec de la couleur pourpre. Envisagez ce qui vous inquiète en ce moment, et représentez-le avec des traits noirs et sombres, sur un fond de pourpre. Puis, laissez votre esprit se libérer et ajoutez des éléments qui vous apportent calme et sécurité, tels que des fleurs ou des oiseaux, en utilisant des couleurs vives et lumineuses. Explorez la relation entre la couleur pourpre et votre sentiment d'inquiétude.`,
        en: `Start by covering a large part of the surface in purple. Consider what is worrying you right now, and set it down with dark black marks over that purple ground. Then let your mind loosen and add things that bring you calm and safety — flowers or birds, say — in bright, luminous colours. Explore the relationship between the colour purple and your sense of worry.`,
      },
      chips: {
        fr: [
          "Technique : Peinture",
          "calme intérieur",
          "libération",
          "sécurité",
        ],
        en: ["Technique: Painting", "inner calm", "release", "safety"],
      },
    },
    {
      id: "creation",
      title: { fr: "3. La création", en: "3. The making" },
      intro: {
        fr: "Pendant les 15 minutes choisies, l'exercice se poursuit même quand l'image surprend. Ici, un fond rose-pourpre structuré de lignes noires, des formes sombres et des soleils jaunes et rouges — une interprétation libre, directe et expressive.",
        en: "Across the 15 minutes chosen, the exercise carries on even when the image surprises. Here, a pink-purple ground structured by black lines, dark shapes and yellow and red suns — a free reading, direct and expressive.",
      },
      image: EXAMPLE_004_ASSETS.artwork,
      imageAlt: {
        fr: "Peinture : champ rose-pourpre traversé de lignes noires horizontales, formes sombres et soleils jaunes et rouges en haut de la feuille",
        en: "Painting: a pink-purple field crossed by horizontal black lines, dark shapes and yellow and red suns at the top of the sheet",
      },
    },
    {
      id: "reflexion",
      title: { fr: "4. Le miroir créatif", en: "4. The creative mirror" },
      intro: {
        fr: "Après la capture, l'IA propose un miroir créatif : elle accueille ce qui est visible — couleurs, geste, contrastes — puis ouvre des questions pour prolonger l'intégration.",
        en: "After the photo, the AI offers a creative mirror: it welcomes what is visible — colours, gesture, contrasts — then opens questions to carry the integration further.",
      },
      body: {
        fr: `Vous avez créé un paysage vibrant, avec des couleurs qui rivalisent entre pourpre, jaune et rouge. Des cercles et des lignes horizontales se croisent, créant une atmosphère abstraite et dynamique. La présence de lignes noires et sombres évoque un sentiment d'inquiétude, mais cela est contrasté par des traits vifs et lumineux qui apportent un sentiment de positivité. La texture rugueuse des couleurs roses ajoute une touche tactile à votre œuvre.

La manière dont vous avez associé la couleur pourpre à votre sentiment d'inquiétude est fascinante. La pourpre, une couleur qui évoque souvent la passion et la créativité, est ici utilisée pour exprimer une émotion plus sombre. Cela nous montre que la couleur peut avoir des connotations différentes pour chacun de nous, et qu'elle peut être utilisée pour exprimer une gamme de sentiments.

Vos couleurs vives et lumineuses évoquent un sentiment de calme et de sécurité, bien au contraire de l'inquiétude que vous aviez exprimée à l'origine. Cela montre comment notre esprit peut se libérer et trouver des solutions à travers la créativité. La présence de fleurs et d'oiseaux dans votre œuvre est également un rappel de la beauté et de la positivité qui peuvent être présentes même dans les moments difficiles.

Encouragez-vous donc à continuer à explorer vos émotions et à les exprimer de manière créative. Votre geste est un pont vers votre âme, et il peut vous aider à trouver des solutions et à vous sentir mieux.`,
        en: `You made a vibrant landscape, with colours competing between purple, yellow and red. Circles and horizontal lines cross each other, creating an abstract, dynamic atmosphere. The dark black lines carry a sense of worry, but that is set against bright, luminous strokes that bring something positive. The rough texture of the pinks adds a tactile quality to the piece.

The way you tied purple to your sense of worry is fascinating. Purple, a colour often linked with passion and creativity, is used here to voice a darker feeling. It shows that colour can mean different things to each of us, and that it can carry a whole range of feelings.

Your bright, luminous colours evoke calm and safety — quite the opposite of the worry you started from. It shows how the mind can loosen and find its way through making. The flowers and birds in your piece are also a reminder of the beauty and lightness that can be there even in difficult moments.

So keep exploring your feelings and letting them speak creatively. Your gesture is a bridge to yourself, and it can help you find your footing and feel better.`,
      },
      openQuestions: {
        fr: [
          "Qu'est-ce qui vous a inspiré à associer la couleur pourpre à votre sentiment d'inquiétude ?",
          "Comment vous sentez-vous maintenant que vous avez exprimé ces émotions ?",
          "Qu'est-ce que vous avez appris de cette expérience et comment pouvez-vous l'appliquer à votre vie quotidienne ?",
        ],
        en: [
          "What led you to tie the colour purple to your sense of worry?",
          "How do you feel now that you have given those feelings a form?",
          "What did this experience teach you, and how might you carry it into everyday life?",
        ],
      },
      followUpExercise: {
        fr: "Envisagez maintenant de créer un tableau qui représente un moment de calme et de sécurité. Utilisez des couleurs vives et lumineuses pour exprimer ce sentiment, et explorez la relation entre la couleur et votre émotion.",
        en: "Now consider making a piece that holds a moment of calm and safety. Use bright, luminous colours to voice that feeling, and explore the relationship between colour and what you feel.",
      },
    },
  ],
  outro: {
    fr: "Cet exemple montre le parcours express Pastek Art : une impulsion émotionnelle, une consigne sur mesure, un temps de création chronométré, puis une réflexion qui accueille l'œuvre telle qu'elle est — y compris ses contrastes. Lancez votre propre rituel avec vos couleurs et votre rythme.",
    en: "This example shows the express Pastek Art journey: an emotional impulse, a brief made for you, a timed stretch of making, then a reflection that welcomes the work exactly as it is — contrasts included. Start your own ritual with your colours and your pace.",
  },
};

export const PASTEK_EXAMPLE_CATALOG: LocalizedPastekExample[] = [
  EXEMPLE_001,
  EXEMPLE_002,
  EXEMPLE_004,
].sort((a, b) => {
  const byDate = b.publishedAt.localeCompare(a.publishedAt);
  if (byDate !== 0) return byDate;
  return b.slug.localeCompare(a.slug);
});

function localizeStep(
  step: LocalizedExampleStep,
  language: AppLanguage
): ExampleStep {
  return {
    id: step.id,
    title: step.title[language],
    intro: step.intro[language],
    body: step.body?.[language],
    chips: step.chips?.[language],
    image: step.image,
    imageAlt: step.imageAlt?.[language],
    openQuestions: step.openQuestions?.[language],
    followUpExercise: step.followUpExercise?.[language],
  };
}

export function localizeExample(
  example: LocalizedPastekExample,
  language: AppLanguage
): PastekExample {
  return {
    slug: example.slug,
    canonicalPath: example.canonicalPath,
    durationMinutes: example.durationMinutes,
    experienceMode: example.experienceMode,
    publishedAt: example.publishedAt,
    heroImage: example.heroImage,
    title: example.title[language],
    subtitle: example.subtitle[language],
    seoTitle: example.seoTitle[language],
    seoDescription: example.seoDescription[language],
    technique: example.technique[language],
    impulse: example.impulse[language],
    keywords: example.keywords[language],
    heroImageAlt: example.heroImageAlt?.[language],
    steps: example.steps.map((step) => localizeStep(step, language)),
    outro: example.outro[language],
  };
}

export function getExamples(language: AppLanguage): PastekExample[] {
  return PASTEK_EXAMPLE_CATALOG.map((e) => localizeExample(e, language));
}

export function getExampleBySlug(
  slug: string,
  language: AppLanguage
): PastekExample | undefined {
  const entry = PASTEK_EXAMPLE_CATALOG.find((e) => e.slug === slug);
  return entry ? localizeExample(entry, language) : undefined;
}
