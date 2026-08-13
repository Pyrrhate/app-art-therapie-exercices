import type { AppLanguage } from "@/lib/i18n/types";
import type {
  Emotion,
  EmotionQuadrant,
  EmotionQuadrantId,
  LocalizedEmotion,
  LocalizedEmotionQuadrant,
} from "./types";

export const EMOTION_QUADRANT_CATALOG: LocalizedEmotionQuadrant[] = [
  {
    id: "high_unpleasant",
    title: {
      fr: "Énergie haute · Désagréable",
      en: "High energy · Unpleasant",
    },
    subtitle: {
      fr: "Intense, inconfortable, agité",
      en: "Intense, uncomfortable, restless",
    },
    color: "#D94432",
    bubbleColor: "#F5A89E",
    energyLabel: { fr: "Énergie haute", en: "High energy" },
    valenceLabel: { fr: "Désagréable", en: "Unpleasant" },
  },
  {
    id: "high_pleasant",
    title: { fr: "Énergie haute · Agréable", en: "High energy · Pleasant" },
    subtitle: {
      fr: "Vif, enthousiaste, lumineux",
      en: "Lively, eager, bright",
    },
    color: "#F0C030",
    bubbleColor: "#F9E08A",
    energyLabel: { fr: "Énergie haute", en: "High energy" },
    valenceLabel: { fr: "Agréable", en: "Pleasant" },
  },
  {
    id: "low_unpleasant",
    title: { fr: "Énergie basse · Désagréable", en: "Low energy · Unpleasant" },
    subtitle: { fr: "Lourd, vide, mélancolique", en: "Heavy, empty, wistful" },
    color: "#4A3060",
    bubbleColor: "#8B6B9E",
    energyLabel: { fr: "Énergie basse", en: "Low energy" },
    valenceLabel: { fr: "Désagréable", en: "Unpleasant" },
  },
  {
    id: "low_pleasant",
    title: { fr: "Énergie basse · Agréable", en: "Low energy · Pleasant" },
    subtitle: { fr: "Calme, doux, apaisé", en: "Calm, gentle, settled" },
    color: "#4A7FB5",
    bubbleColor: "#9BC0E0",
    energyLabel: { fr: "Énergie basse", en: "Low energy" },
    valenceLabel: { fr: "Agréable", en: "Pleasant" },
  },
  {
    id: "neutral",
    title: { fr: "Neutre · Incertain", en: "Neutral · Unclear" },
    subtitle: {
      fr: "Ni haut ni bas, ni clair ni lourd",
      en: "Neither high nor low, neither light nor heavy",
    },
    color: "#9A9A9A",
    bubbleColor: "#C8C8C8",
    energyLabel: { fr: "Neutre", en: "Neutral" },
    valenceLabel: { fr: "Incertain", en: "Unclear" },
  },
];

export const EMOTION_CATALOG: LocalizedEmotion[] = [
  // high_unpleasant
  {
    id: "irritated",
    quadrantId: "high_unpleasant",
    label: { fr: "Agacé·e", en: "Irritated" },
    description: {
      fr: "Une tension qui cherche à sortir, parfois sans mot précis.",
      en: "A tension looking for a way out, often without a precise word.",
    },
  },
  {
    id: "anxious",
    quadrantId: "high_unpleasant",
    label: { fr: "Anxieux·se", en: "Anxious" },
    description: {
      fr: "L'esprit accélère ; le corps anticipe sans certitude.",
      en: "The mind speeds up; the body braces without knowing for what.",
    },
  },
  {
    id: "frustrated",
    quadrantId: "high_unpleasant",
    label: { fr: "Frustré·e", en: "Frustrated" },
    description: {
      fr: "Un blocage entre ce que vous voulez et ce qui est possible.",
      en: "Something stuck between what you want and what is possible.",
    },
  },
  {
    id: "tense",
    quadrantId: "high_unpleasant",
    label: { fr: "Tendu·e", en: "Tense" },
    description: {
      fr: "Les épaules, la mâchoire ou le ventre portent la pression.",
      en: "Shoulders, jaw or belly are carrying the pressure.",
    },
  },
  {
    id: "uneasy",
    quadrantId: "high_unpleasant",
    label: { fr: "Mal à l'aise", en: "Uneasy" },
    description: {
      fr: "Impression vague que quelque chose ne va pas.",
      en: "A vague sense that something is off.",
    },
  },
  {
    id: "restless",
    quadrantId: "high_unpleasant",
    label: { fr: "Agité·e", en: "Restless" },
    description: {
      fr: "Difficile de rester en place ; l'énergie cherche une issue.",
      en: "Hard to sit still; the energy is looking for somewhere to go.",
    },
  },
  {
    id: "confused",
    quadrantId: "high_unpleasant",
    label: { fr: "Confus·e", en: "Confused" },
    description: {
      fr: "Trop d'informations ou d'émotions en même temps.",
      en: "Too much information or too many feelings at once.",
    },
  },
  {
    id: "overwhelmed",
    quadrantId: "high_unpleasant",
    label: { fr: "Submergé·e", en: "Overwhelmed" },
    description: {
      fr: "Tout semble trop grand ou trop rapide à gérer.",
      en: "Everything feels too big or too fast to handle.",
    },
  },
  // high_pleasant
  {
    id: "energized",
    quadrantId: "high_pleasant",
    label: { fr: "Énergique", en: "Energised" },
    description: {
      fr: "De la vivacité prête à se déployer dans l'action.",
      en: "A liveliness ready to spill into action.",
    },
  },
  {
    id: "joyful",
    quadrantId: "high_pleasant",
    label: { fr: "Joyeux·se", en: "Joyful" },
    description: {
      fr: "Une légèreté qui élargit la poitrine.",
      en: "A lightness that opens up the chest.",
    },
  },
  {
    id: "motivated",
    quadrantId: "high_pleasant",
    label: { fr: "Motivé·e", en: "Motivated" },
    description: {
      fr: "Envie claire d'avancer vers quelque chose qui compte.",
      en: "A clear wish to move toward something that matters.",
    },
  },
  {
    id: "excited",
    quadrantId: "high_pleasant",
    label: { fr: "Enthousiaste", en: "Excited" },
    description: {
      fr: "Anticipation positive, curiosité en mouvement.",
      en: "Warm anticipation, curiosity on the move.",
    },
  },
  {
    id: "proud",
    quadrantId: "high_pleasant",
    label: { fr: "Fier·ère", en: "Proud" },
    description: {
      fr: "Satisfaction d'avoir accompli ou tenu bon.",
      en: "Quiet satisfaction at having done it, or held on.",
    },
  },
  {
    id: "grateful",
    quadrantId: "high_pleasant",
    label: { fr: "Reconnaissant·e", en: "Grateful" },
    description: {
      fr: "Attention portée à ce qui nourrit, même modestement.",
      en: "Attention on what nourishes you, however small.",
    },
  },
  {
    id: "playful",
    quadrantId: "high_pleasant",
    label: { fr: "Enjoué·e", en: "Playful" },
    description: {
      fr: "Disposition à explorer sans enjeu lourd.",
      en: "Ready to explore with nothing heavy at stake.",
    },
  },
  {
    id: "inspired",
    quadrantId: "high_pleasant",
    label: { fr: "Inspiré·e", en: "Inspired" },
    description: {
      fr: "Une étincelle qui appelle la création.",
      en: "A spark asking to be made into something.",
    },
  },
  // low_unpleasant
  {
    id: "sad",
    quadrantId: "low_unpleasant",
    label: { fr: "Triste", en: "Sad" },
    description: {
      fr: "Un poids doux ou profond autour du cœur.",
      en: "A soft or deep weight around the heart.",
    },
  },
  {
    id: "tired",
    quadrantId: "low_unpleasant",
    label: { fr: "Fatigué·e", en: "Tired" },
    description: {
      fr: "Les ressources semblent basses ; le repos appelle.",
      en: "Reserves feel low; rest is calling.",
    },
  },
  {
    id: "bored",
    quadrantId: "low_unpleasant",
    label: { fr: "Ennuyé·e", en: "Bored" },
    description: {
      fr: "Manque de stimulation ; l'attention s'échappe.",
      en: "Not much to hold you; attention keeps slipping away.",
    },
  },
  {
    id: "lonely",
    quadrantId: "low_unpleasant",
    label: { fr: "Seul·e", en: "Lonely" },
    description: {
      fr: "Distance ressentie avec les autres ou avec soi.",
      en: "A felt distance from others, or from yourself.",
    },
  },
  {
    id: "melancholic",
    quadrantId: "low_unpleasant",
    label: { fr: "Mélancolique", en: "Melancholic" },
    description: {
      fr: "Nostalgie ou douceur triste qui invite à ralentir.",
      en: "A wistful sweetness that invites you to slow down.",
    },
  },
  {
    id: "empty",
    quadrantId: "low_unpleasant",
    label: { fr: "Vide", en: "Empty" },
    description: {
      fr: "Peu de sensations nettes ; un blanc intérieur.",
      en: "Few clear sensations; a blank space inside.",
    },
  },
  {
    id: "discouraged",
    quadrantId: "low_unpleasant",
    label: { fr: "Découragé·e", en: "Discouraged" },
    description: {
      fr: "L'élan s'est affaibli ; difficile de relancer.",
      en: "The momentum has faded; hard to get going again.",
    },
  },
  {
    id: "worried",
    quadrantId: "low_unpleasant",
    label: { fr: "Inquiet·ète", en: "Worried" },
    description: {
      fr: "Préoccupation sourde qui tourne en boucle.",
      en: "A quiet concern going round and round.",
    },
  },
  // low_pleasant
  {
    id: "calm",
    quadrantId: "low_pleasant",
    label: { fr: "Calme", en: "Calm" },
    description: {
      fr: "Respiration plus ample ; le corps se relâche.",
      en: "Breath comes wider; the body lets go.",
    },
  },
  {
    id: "peaceful",
    quadrantId: "low_pleasant",
    label: { fr: "Paisible", en: "Peaceful" },
    description: {
      fr: "Absence de lutte intérieure, présence douce.",
      en: "No inner struggle, just a gentle presence.",
    },
  },
  {
    id: "content",
    quadrantId: "low_pleasant",
    label: { fr: "Content·e", en: "Content" },
    description: {
      fr: "Suffisance du moment, sans exigence.",
      en: "This moment is enough, nothing more asked of it.",
    },
  },
  {
    id: "serene",
    quadrantId: "low_pleasant",
    label: { fr: "Serein·e", en: "Serene" },
    description: {
      fr: "Clarté intérieure, même face à l'incertitude.",
      en: "Inner clarity, even facing what is uncertain.",
    },
  },
  {
    id: "tender",
    quadrantId: "low_pleasant",
    label: { fr: "Tendre", en: "Tender" },
    description: {
      fr: "Douceur envers soi ou envers ce qui entoure.",
      en: "Kindness toward yourself, or toward what surrounds you.",
    },
  },
  {
    id: "grounded",
    quadrantId: "low_pleasant",
    label: { fr: "Ancré·e", en: "Grounded" },
    description: {
      fr: "Sensation d'être ici, dans son corps, dans l'instant.",
      en: "A sense of being here, in your body, in the moment.",
    },
  },
  {
    id: "relieved",
    quadrantId: "low_pleasant",
    label: { fr: "Soulagé·e", en: "Relieved" },
    description: {
      fr: "Un poids qui se lève après une tension passée.",
      en: "A weight lifting once the tension has passed.",
    },
  },
  {
    id: "hopeful",
    quadrantId: "low_pleasant",
    label: { fr: "Confiant·e", en: "Hopeful" },
    description: {
      fr: "Ouverture modeste vers demain, sans certitude.",
      en: "A modest opening toward tomorrow, without certainty.",
    },
  },
  // neutral
  {
    id: "neutral_feel",
    quadrantId: "neutral",
    label: { fr: "Neutre", en: "Neutral" },
    description: {
      fr: "Ni particulièrement bien ni mal — juste présent·e.",
      en: "Neither especially good nor bad — simply here.",
    },
  },
  {
    id: "uncertain",
    quadrantId: "neutral",
    label: { fr: "Incertain·e", en: "Uncertain" },
    description: {
      fr: "Difficile de nommer ce que vous ressentez en ce moment.",
      en: "Hard to name what you are feeling right now.",
    },
  },
  {
    id: "in_between",
    quadrantId: "neutral",
    label: { fr: "Entre-deux", en: "In between" },
    description: {
      fr: "Plusieurs états se chevauchent sans dominer.",
      en: "Several states overlap, none of them taking the lead.",
    },
  },
  {
    id: "numb",
    quadrantId: "neutral",
    label: { fr: "Engourdi·e", en: "Numb" },
    description: {
      fr: "Peu de sensations nettes — comme en pause intérieure.",
      en: "Few clear sensations — a kind of inner pause.",
    },
  },
  {
    id: "surprised",
    quadrantId: "neutral",
    label: { fr: "Surpris·e", en: "Surprised" },
    description: {
      fr: "Quelque chose a déplacé votre équilibre sans prévenir.",
      en: "Something shifted your balance without warning.",
    },
  },
  {
    id: "distracted",
    quadrantId: "neutral",
    label: { fr: "Distrait·e", en: "Distracted" },
    description: {
      fr: "L'attention part ailleurs ; le corps reste là.",
      en: "Attention wanders off; the body stays put.",
    },
  },
  {
    id: "okay",
    quadrantId: "neutral",
    label: { fr: "Ça va", en: "Doing okay" },
    description: {
      fr: "Pas de vague forte — un terrain stable et ordinaire.",
      en: "No big waves — steady, ordinary ground.",
    },
  },
  {
    id: "curious_mood",
    quadrantId: "neutral",
    label: { fr: "Curieux·se", en: "Curious" },
    description: {
      fr: "Ouvert·e à explorer sans charge émotionnelle forte.",
      en: "Open to explore, with no strong emotional charge.",
    },
  },
];

function localizeQuadrant(
  quadrant: LocalizedEmotionQuadrant,
  language: AppLanguage
): EmotionQuadrant {
  return {
    id: quadrant.id,
    color: quadrant.color,
    bubbleColor: quadrant.bubbleColor,
    title: quadrant.title[language],
    subtitle: quadrant.subtitle[language],
    energyLabel: quadrant.energyLabel[language],
    valenceLabel: quadrant.valenceLabel[language],
  };
}

function localizeEmotion(
  emotion: LocalizedEmotion,
  language: AppLanguage
): Emotion {
  return {
    id: emotion.id,
    quadrantId: emotion.quadrantId,
    label: emotion.label[language],
    description: emotion.description[language],
  };
}

export function getEmotionQuadrants(language: AppLanguage): EmotionQuadrant[] {
  return EMOTION_QUADRANT_CATALOG.map((q) => localizeQuadrant(q, language));
}

export function getEmotions(language: AppLanguage): Emotion[] {
  return EMOTION_CATALOG.map((e) => localizeEmotion(e, language));
}

export function getQuadrant(
  id: EmotionQuadrantId,
  language: AppLanguage
): EmotionQuadrant {
  return localizeQuadrant(
    EMOTION_QUADRANT_CATALOG.find((q) => q.id === id)!,
    language
  );
}

export function getEmotionsForQuadrant(
  quadrantId: EmotionQuadrantId,
  language: AppLanguage
): Emotion[] {
  return EMOTION_CATALOG.filter((e) => e.quadrantId === quadrantId).map((e) =>
    localizeEmotion(e, language)
  );
}

export function searchEmotions(query: string, language: AppLanguage): Emotion[] {
  const emotions = getEmotions(language);
  const q = query.trim().toLowerCase();
  if (!q) return emotions;
  return emotions.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
  );
}
