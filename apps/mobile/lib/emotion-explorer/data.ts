import type { Emotion, EmotionQuadrant, EmotionQuadrantId } from "./types";

export const EMOTION_QUADRANTS: EmotionQuadrant[] = [
  {
    id: "high_unpleasant",
    title: "Énergie haute · Désagréable",
    subtitle: "Intense, inconfortable, agité",
    color: "#F0705A",
    bubbleColor: "#F8B4A8",
    energyLabel: "Énergie haute",
    valenceLabel: "Désagréable",
  },
  {
    id: "high_pleasant",
    title: "Énergie haute · Agréable",
    subtitle: "Vif, enthousiaste, lumineux",
    color: "#F0C94A",
    bubbleColor: "#F9E08A",
    energyLabel: "Énergie haute",
    valenceLabel: "Agréable",
  },
  {
    id: "low_unpleasant",
    title: "Énergie basse · Désagréable",
    subtitle: "Lourd, vide, mélancolique",
    color: "#6B8FB5",
    bubbleColor: "#A8C0DA",
    energyLabel: "Énergie basse",
    valenceLabel: "Désagréable",
  },
  {
    id: "low_pleasant",
    title: "Énergie basse · Agréable",
    subtitle: "Calme, doux, apaisé",
    color: "#6B8F71",
    bubbleColor: "#A8C9AE",
    energyLabel: "Énergie basse",
    valenceLabel: "Agréable",
  },
  {
    id: "neutral",
    title: "Neutre · Incertain",
    subtitle: "Ni haut ni bas, ni clair ni lourd",
    color: "#C9B8A8",
    bubbleColor: "#E8DDD4",
    energyLabel: "Neutre",
    valenceLabel: "Incertain",
  },
];

export const EMOTIONS: Emotion[] = [
  // high_unpleasant
  {
    id: "irritated",
    quadrantId: "high_unpleasant",
    label: "Agacé·e",
    description: "Une tension qui cherche à sortir, parfois sans mot précis.",
  },
  {
    id: "anxious",
    quadrantId: "high_unpleasant",
    label: "Anxieux·se",
    description: "L'esprit accélère ; le corps anticipe sans certitude.",
  },
  {
    id: "frustrated",
    quadrantId: "high_unpleasant",
    label: "Frustré·e",
    description: "Un blocage entre ce que vous voulez et ce qui est possible.",
  },
  {
    id: "tense",
    quadrantId: "high_unpleasant",
    label: "Tendu·e",
    description: "Les épaules, la mâchoire ou le ventre portent la pression.",
  },
  {
    id: "uneasy",
    quadrantId: "high_unpleasant",
    label: "Mal à l'aise",
    description: "Impression vague que quelque chose ne va pas.",
  },
  {
    id: "restless",
    quadrantId: "high_unpleasant",
    label: "Agité·e",
    description: "Difficile de rester en place ; l'énergie cherche une issue.",
  },
  {
    id: "confused",
    quadrantId: "high_unpleasant",
    label: "Confus·e",
    description: "Trop d'informations ou d'émotions en même temps.",
  },
  {
    id: "overwhelmed",
    quadrantId: "high_unpleasant",
    label: "Submergé·e",
    description: "Tout semble trop grand ou trop rapide à gérer.",
  },
  // high_pleasant
  {
    id: "energized",
    quadrantId: "high_pleasant",
    label: "Énergique",
    description: "De la vivacité prête à se déployer dans l'action.",
  },
  {
    id: "joyful",
    quadrantId: "high_pleasant",
    label: "Joyeux·se",
    description: "Une légèreté qui élargit la poitrine.",
  },
  {
    id: "motivated",
    quadrantId: "high_pleasant",
    label: "Motivé·e",
    description: "Envie claire d'avancer vers quelque chose qui compte.",
  },
  {
    id: "excited",
    quadrantId: "high_pleasant",
    label: "Enthousiaste",
    description: "Anticipation positive, curiosité en mouvement.",
  },
  {
    id: "proud",
    quadrantId: "high_pleasant",
    label: "Fier·ère",
    description: "Satisfaction d'avoir accompli ou tenu bon.",
  },
  {
    id: "grateful",
    quadrantId: "high_pleasant",
    label: "Reconnaissant·e",
    description: "Attention portée à ce qui nourrit, même modestement.",
  },
  {
    id: "playful",
    quadrantId: "high_pleasant",
    label: "Enjoué·e",
    description: "Disposition à explorer sans enjeu lourd.",
  },
  {
    id: "inspired",
    quadrantId: "high_pleasant",
    label: "Inspiré·e",
    description: "Une étincelle qui appelle la création.",
  },
  // low_unpleasant
  {
    id: "sad",
    quadrantId: "low_unpleasant",
    label: "Triste",
    description: "Un poids doux ou profond autour du cœur.",
  },
  {
    id: "tired",
    quadrantId: "low_unpleasant",
    label: "Fatigué·e",
    description: "Les ressources semblent basses ; le repos appelle.",
  },
  {
    id: "bored",
    quadrantId: "low_unpleasant",
    label: "Ennuyé·e",
    description: "Manque de stimulation ; l'attention s'échappe.",
  },
  {
    id: "lonely",
    quadrantId: "low_unpleasant",
    label: "Seul·e",
    description: "Distance ressentie avec les autres ou avec soi.",
  },
  {
    id: "melancholic",
    quadrantId: "low_unpleasant",
    label: "Mélancolique",
    description: "Nostalgie ou douceur triste qui invite à ralentir.",
  },
  {
    id: "empty",
    quadrantId: "low_unpleasant",
    label: "Vide",
    description: "Peu de sensations nettes ; un blanc intérieur.",
  },
  {
    id: "discouraged",
    quadrantId: "low_unpleasant",
    label: "Découragé·e",
    description: "L'élan s'est affaibli ; difficile de relancer.",
  },
  {
    id: "worried",
    quadrantId: "low_unpleasant",
    label: "Inquiet·ète",
    description: "Préoccupation sourde qui tourne en boucle.",
  },
  // low_pleasant
  {
    id: "calm",
    quadrantId: "low_pleasant",
    label: "Calme",
    description: "Respiration plus ample ; le corps se relâche.",
  },
  {
    id: "peaceful",
    quadrantId: "low_pleasant",
    label: "Paisible",
    description: "Absence de lutte intérieure, présence douce.",
  },
  {
    id: "content",
    quadrantId: "low_pleasant",
    label: "Content·e",
    description: "Suffisance du moment, sans exigence.",
  },
  {
    id: "serene",
    quadrantId: "low_pleasant",
    label: "Serein·e",
    description: "Clarté intérieure, même face à l'incertitude.",
  },
  {
    id: "tender",
    quadrantId: "low_pleasant",
    label: "Tendre",
    description: "Douceur envers soi ou envers ce qui entoure.",
  },
  {
    id: "grounded",
    quadrantId: "low_pleasant",
    label: "Ancré·e",
    description: "Sensation d'être ici, dans son corps, dans l'instant.",
  },
  {
    id: "relieved",
    quadrantId: "low_pleasant",
    label: "Soulagé·e",
    description: "Un poids qui se lève après une tension passée.",
  },
  {
    id: "hopeful",
    quadrantId: "low_pleasant",
    label: "Confiant·e",
    description: "Ouverture modeste vers demain, sans certitude.",
  },
  // neutral
  {
    id: "neutral_feel",
    quadrantId: "neutral",
    label: "Neutre",
    description: "Ni particulièrement bien ni mal — juste présent·e.",
  },
  {
    id: "uncertain",
    quadrantId: "neutral",
    label: "Incertain·e",
    description: "Difficile de nommer ce que vous ressentez en ce moment.",
  },
  {
    id: "in_between",
    quadrantId: "neutral",
    label: "Entre-deux",
    description: "Plusieurs états se chevauchent sans dominer.",
  },
  {
    id: "numb",
    quadrantId: "neutral",
    label: "Engourdi·e",
    description: "Peu de sensations nettes — comme en pause intérieure.",
  },
  {
    id: "surprised",
    quadrantId: "neutral",
    label: "Surpris·e",
    description: "Quelque chose a déplacé votre équilibre sans prévenir.",
  },
  {
    id: "distracted",
    quadrantId: "neutral",
    label: "Distrait·e",
    description: "L'attention part ailleurs ; le corps reste là.",
  },
  {
    id: "okay",
    quadrantId: "neutral",
    label: "Ça va",
    description: "Pas de vague forte — un terrain stable et ordinaire.",
  },
  {
    id: "curious_mood",
    quadrantId: "neutral",
    label: "Curieux·se",
    description: "Ouvert·e à explorer sans charge émotionnelle forte.",
  },
];

export function getQuadrant(id: EmotionQuadrantId): EmotionQuadrant {
  return EMOTION_QUADRANTS.find((q) => q.id === id)!;
}

export function getEmotionsForQuadrant(quadrantId: EmotionQuadrantId): Emotion[] {
  return EMOTIONS.filter((e) => e.quadrantId === quadrantId);
}

export function searchEmotions(query: string): Emotion[] {
  const q = query.trim().toLowerCase();
  if (!q) return EMOTIONS;
  return EMOTIONS.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
  );
}
