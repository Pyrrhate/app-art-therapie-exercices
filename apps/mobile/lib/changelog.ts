/** Entrée de changelog produit — mises à jour majeures uniquement. */
export type ChangelogEntry = {
  id: string;
  /** Libellé affiché (ex. « 24 juin 2026 » ou « juin 2026 »). */
  dateLabel: string;
  title: string;
  highlights: string[];
};

/**
 * Grandes mises à jour Pastek Art, du plus récent au plus ancien.
 * Les petits correctifs et commits techniques ne sont pas listés ici.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "local-first-drive",
    dateLabel: "août 2026",
    title: "Local-first & sauvegarde Google Drive",
    highlights: [
      "Plus de mur de connexion ni de compte Pastek obligatoire : l’app fonctionne d’abord sur l’appareil.",
      "Sauvegarde et restauration du Fil via Google Drive côté client (OAuth local), sans sync serveur des traces.",
      "Vos rituels restent chez vous ; le cloud n’est qu’une option de backup.",
    ],
  },
  {
    id: "byok-moteurs",
    dateLabel: "août 2026",
    title: "Vos clés IA (BYOK) & moteurs souverains",
    highlights: [
      "Apportez votre propre clé API : elle reste sur l’appareil et n’est jamais stockée par Pastek Art.",
      "Fournisseurs européens & souverains : Mistral, Scaleway, OVHcloud, Aleph Alpha, Ollama (local).",
      "Fournisseurs globaux : OpenAI, Anthropic (Claude), Google Gemini — avec test de connexion dans les réglages.",
    ],
  },
  {
    id: "gratuit-prompts",
    dateLabel: "août 2026",
    title: "Accès libre & prompts personnalisables",
    highlights: [
      "Le générateur est utilisable sans crédits Premium : mode gratuit (Hugging Face) ou votre clé personnelle.",
      "Consultation et personnalisation locale des prompts système (exercice, miroir, vision, OCR).",
      "Export PDF des rituels du Fil avec la photo de votre création.",
    ],
  },
  {
    id: "assistant-palette",
    dateLabel: "juillet 2026",
    title: "Assistant palette peinture",
    highlights: [
      "L'ancienne Palette intérieure devient un assistant RYB : primaires, secondaires, tertiaires.",
      "Recettes de mélange et ratio 60·30·10 pour le dessin et la peinture.",
      "Conseils peinture personnalisés par IA à chaque étape.",
    ],
  },
  {
    id: "express-profond",
    dateLabel: "juin 2026",
    title: "Parcours Express & Profond",
    highlights: [
      "Choix du rythme dès l'impulsion : parcours rapide ou guidé en profondeur.",
      "Mode Profond : questionnaire d'ancrage avant le miroir créatif, puis pistes d'intégration pour clore la séance.",
      "Passerelle discrète depuis l'express pour basculer vers le profond à la réflexion.",
    ],
  },
  {
    id: "sur-mesure",
    dateLabel: "juin 2026",
    title: "Mode Sur-Mesure & second tour augmenté",
    highlights: [
      "Nouveau parcours personnalisé : filtres, tags et intention pour générer un exercice sur mesure.",
      "Second tour de création enrichi selon ce qui a évolué pendant la réflexion.",
      "Passerelle express → profond renforcée pour prolonger une séance déjà commencée.",
    ],
  },
  {
    id: "site-seo",
    dateLabel: "juin 2026",
    title: "Site pastek-art.eu & application sous /app",
    highlights: [
      "Page d'accueil SEO à la racine du domaine, avec présentation de l'art-thérapie créative.",
      "Application interactive déplacée sous /app pour séparer marketing et outil.",
      "Logo et baseline cliquables pour revenir à l'accueil du site.",
    ],
  },
  {
    id: "fil-memoire",
    dateLabel: "juin 2026",
    title: "Fil créatif & mémoire des pratiques",
    highlights: [
      "Enregistrement automatique de chaque rituel et amorce dans le Fil créatif.",
      "Export et restauration manuelle de votre Fil (fichier local, sans compte).",
      "Vue détaillée par trace : impulsion, technique, réflexion et source.",
    ],
  },
  {
    id: "identite-pastek",
    dateLabel: "juin 2026",
    title: "Identité visuelle Pastek Art",
    highlights: [
      "Refonte complète : typographies Lora & Nunito Sans, palette crème et sauge.",
      "Accueil repensé avec modules en cartes, CTA rituel mis en avant.",
      "Boutons pill, icônes unifiées et design cohérent sur tous les écrans.",
    ],
  },
  {
    id: "explorateur-emotionnel",
    dateLabel: "juin 2026",
    title: "Explorateur émotionnel",
    highlights: [
      "Amorce inspirée des cartes de ressenti : quatre zones, un mot précis.",
      "Quadrant neutre et animations douces pour parcourir les émotions sans jugement.",
      "Enchaînement direct vers le rituel créatif.",
    ],
  },
  {
    id: "parcours-rituel",
    dateLabel: "juin 2026",
    title: "Parcours rituel clarifié",
    highlights: [
      "Barre Impulsion · Exercice · Réflexion sur tout le flux.",
      "Mots-clés visibles dès l'exercice, timer zen précis avec son de fin configurable.",
      "Écran réflexion repensé : miroir créatif, questions ouvertes et suivi d'exercice séparés.",
    ],
  },
  {
    id: "amorces",
    dateLabel: "juin 2026",
    title: "Amorces créatives",
    highlights: [
      "Palette intérieure : trois teintes, miroir chromatique IA optionnel.",
      "Ping-Pong créatif : amorce rapide en quelques mots.",
      "Chercheur de Nuances : lotus élémentaires et pont rituel ou exercice.",
    ],
  },
  {
    id: "mvp-fil",
    dateLabel: "juin 2026",
    title: "Lancement du générateur d'exercices",
    highlights: [
      "Rituel en trois temps : impulsion, exercice chronométré, capture & réflexion.",
      "Génération d'exercices par IA (Hugging Face) avec repli local hors ligne.",
      "Onze techniques artistiques, durées 15 / 30 / 45 minutes.",
    ],
  },
];
