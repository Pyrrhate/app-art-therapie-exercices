import type { SeasonDefinition } from "./types";

export const SEASON_CATALOG: SeasonDefinition[] = [
  {
    id: "une-dominante",
    title: "Une dominante",
    durationDays: 7,
    kind: "color",
    constraint:
      "Une seule couleur dominante. Les autres n'apparaissent qu'en touches, ou pas du tout.",
    invitation:
      "Sept jours pour habiter une teinte. Choisissez-la ce matin — un bleu, un ocre, un vert fatigué — et laissez-la décider du reste. Le fond, les silences, ce que vous n'osez pas encore.",
    suggestedTechnique: "painting",
    suggestedImpulse: "Une seule couleur, et tout ce qu'elle contient",
    accent: "#C45C26",
  },
  {
    id: "poche-a6",
    title: "Format poche",
    durationDays: 7,
    kind: "format",
    constraint:
      "Support de poche (A6, carte, enveloppe, coin de carnet). Rien de plus grand.",
    invitation:
      "Un petit rectangle. Pas d'ambition murale. Le geste se concentre, le temps tient dans la paume. Sept jours de formats que l'on pourrait glisser dans une poche.",
    suggestedTechnique: "drawing",
    suggestedImpulse: "Un format qui tient dans la main",
    accent: "#6B8F71",
  },
  {
    id: "rien-que-collage",
    title: "Rien que le collage",
    durationDays: 10,
    kind: "technique",
    constraint:
      "Collage uniquement : papiers, revues, tickets, restes. Assembler plutôt que tracer.",
    invitation:
      "Dix jours sans crayon obligatoire. On coupe, on déchire, on pose. La composition naît des hasards du papier — une pub, un ticket, un ciel déjà imprimé.",
    suggestedTechnique: "collage",
    suggestedImpulse: "Ce qui traîne, assemblé",
    accent: "#F87A7A",
  },
  {
    id: "trait-continu",
    title: "Le trait qui ne lève pas",
    durationDays: 7,
    kind: "gesture",
    constraint:
      "Un trait aussi continu que possible. S'il quitte le papier, c'est un nouveau départ, pas une erreur.",
    invitation:
      "Le crayon reste en contact. La ligne cherche, hésite, revient. Sept jours pour désapprendre le « joli » et retrouver le mouvement.",
    suggestedTechnique: "drawing",
    suggestedImpulse: "Une ligne qui n'a pas le droit de s'interrompre",
    accent: "#4A6B52",
  },
  {
    id: "terres",
    title: "Terres",
    durationDays: 14,
    kind: "color",
    constraint:
      "Palette de terres : ocre, sienne, ombre, crème. Peu ou pas de couleurs froides.",
    invitation:
      "Une quinzaine dans les bruns chauds. Pigments de sol, papiers jaunis, lumières d'après-midi. Le temps de s'y habituer — puis de voir ce qui reste quand le bleu s'absente.",
    suggestedTechnique: "painting",
    suggestedImpulse: "Ocre, sienne, terre d'ombre",
    accent: "#B8864A",
  },
];

export function getSeasonDefinition(id: string): SeasonDefinition | undefined {
  return SEASON_CATALOG.find((s) => s.id === id);
}
