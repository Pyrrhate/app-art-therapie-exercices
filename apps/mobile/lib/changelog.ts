import type { AppLanguage } from "@/lib/i18n/types";

/** Entrée de changelog produit — mises à jour majeures uniquement. */
export type ChangelogEntry = {
  id: string;
  /** Libellé affiché (ex. « 24 juin 2026 » ou « juin 2026 »). */
  dateLabel: string;
  title: string;
  highlights: string[];
};

/** Même entrée, avec les textes disponibles dans chaque langue. */
export type LocalizedChangelogEntry = {
  id: string;
  dateLabel: Record<AppLanguage, string>;
  title: Record<AppLanguage, string>;
  highlights: Record<AppLanguage, string[]>;
};

/**
 * Grandes mises à jour Pastek Art, du plus récent au plus ancien.
 * Les petits correctifs et commits techniques ne sont pas listés ici.
 */
export const CHANGELOG_CATALOG: LocalizedChangelogEntry[] = [
  {
    id: "creative-tips-optin",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Pistes créatives (sur demande)",
      en: "Creative prompts (on request)",
    },
    highlights: {
      fr: [
        "Après votre exercice : bouton optionnel « Demander des pistes créatives » — associations, symbolisme doux, gestes en ouverture.",
        "Ne remplace pas la consigne ni le développement déjà généré ; repliable, court, ton coach créatif.",
      ],
      en: [
        "After your exercise: optional “Ask for creative prompts” — associations, gentle symbolism, opening gestures.",
        "Doesn’t replace the brief or its development; collapsible, short, creative-coach tone.",
      ],
    },
  },
  {
    id: "onedrive-local-first",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Sauvegarde OneDrive (local-first)",
      en: "OneDrive backup (local-first)",
    },
    highlights: {
      fr: [
        "OneDrive via Microsoft Graph : collez un jeton Files.ReadWrite — aucun secret Azure / OneDrive sur Vercel (comme kDrive).",
        "Dossier « Pastek Art », sauvegarde / restauration et photos optionnelles. Idéal pour les utilisateurs au Canada.",
      ],
      en: [
        "OneDrive via Microsoft Graph: paste a Files.ReadWrite token — no Azure / OneDrive secrets on Vercel (same model as kDrive).",
        "“Pastek Art” folder, backup / restore and optional photos. Ideal for users in Canada.",
      ],
    },
  },
  {
    id: "cohere-canada",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Cohere — moteur IA canadien",
      en: "Cohere — Canadian AI engine",
    },
    highlights: {
      fr: [
        "Nouveau fournisseur BYOK Cohere (Toronto) dans une section Canada, entre l'Europe et les moteurs globaux.",
        "Compatibility API OpenAI-compatible : Command A + vision, avec modèles de secours automatiques.",
      ],
      en: [
        "New Cohere BYOK provider (Toronto) in a Canada section, between Europe and the global engines.",
        "OpenAI-compatible Compatibility API: Command A + vision, with automatic fallback models.",
      ],
    },
  },
  {
    id: "kdrive-infomaniak",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Sauvegarde Infomaniak kDrive",
      en: "Infomaniak kDrive backup",
    },
    highlights: {
      fr: [
        "En plus de Google Drive : connectez votre kDrive avec un jeton API Infomaniak (scope drive) et l'ID de votre drive.",
        "Même modèle local-first — dossier « Pastek Art », sauvegarde / restauration, photos optionnelles. Le jeton reste sur l'appareil.",
      ],
      en: [
        "Alongside Google Drive: connect your kDrive with an Infomaniak API token (drive scope) and your drive ID.",
        "Same local-first model — “Pastek Art” folder, backup / restore, optional photos. The token stays on the device.",
      ],
    },
  },
  {
    id: "glossaire-nav-site",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Glossaire créatif & navigation du site",
      en: "Creative glossary & site navigation",
    },
    highlights: {
      fr: [
        "Nouvelle page Glossaire : 15 termes techniques et créatifs (impulsion, miroir, Fil, BYOK…), FR / EN, indexable.",
        "Navigation du site allégée : Fonctionnalités → Exemples → Glossaire → Espace créatif (Config IA et À propos retirés du menu).",
      ],
      en: [
        "A new Glossary page: 15 technical and creative terms (impulse, mirror, Thread, BYOK…), FR / EN, indexable.",
        "A lighter site navigation: Features → Examples → Glossary → Creative space (AI setup and About removed from the menu).",
      ],
    },
  },
  {
    id: "amorces-geste-regle",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Amorces Trois gestes & Une seule règle",
      en: "Three gestures & One rule starters",
    },
    highlights: {
      fr: [
        "Trois gestes : trois micro-gestes tirés au sort — choisir avec le corps, puis passer au rituel.",
        "Une seule règle : une contrainte douce (re-tirages limités) pour ouvrir l'impulsion sans IA obligatoire.",
      ],
      en: [
        "Three gestures: three micro-gestures drawn at random — choose with the body, then move into the ritual.",
        "One rule: a gentle constraint (limited redraws) to unlock an impulse, with no AI required.",
      ],
    },
  },
  {
    id: "i18n-fr-en",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: { fr: "Interface FR / EN", en: "FR / EN interface" },
    highlights: {
      fr: [
        "Bascule Français / English dans la navigation et les réglages (préférence locale).",
        "Toute l'interface suit la langue choisie — y compris les consignes d'exercice générées.",
        "Le contenu déjà enregistré dans le Fil (résumés, miroirs, énoncés) reste dans sa langue d'origine.",
      ],
      en: [
        "A Français / English switch in the navigation and settings (kept on your device).",
        "The whole interface follows the language you choose — including generated exercise briefs.",
        "Content already saved in the Thread (summaries, mirrors, briefs) stays in its original language.",
      ],
    },
  },
  {
    id: "fil-saisons-lecture",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Fil mosaïque, tags & saisons créatives",
      en: "Thread mosaic, tags & creative seasons",
    },
    highlights: {
      fr: [
        "Le Fil se parcourt en mosaïque visuelle : photos, couleurs, tags (technique + les vôtres).",
        "Saisons de 7 à 14 jours : une contrainte douce (couleur, format, technique) pour installer une habitude, sans streak.",
        "Page Fonctionnalités pour lire l'atelier — et « Exemples » dans la navigation du site.",
      ],
      en: [
        "Browse the Thread as a visual mosaic: photos, colours, tags (technique plus your own).",
        "Seasons of 7 to 14 days: one gentle constraint (colour, format, technique) to settle into a habit, with no streaks.",
        "A Features page to read about the studio — and “Examples” in the site navigation.",
      ],
    },
  },
  {
    id: "silence-fil-miroir",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Silence créatif & miroir longitudinal",
      en: "Creative silence & a mirror across time",
    },
    highlights: {
      fr: [
        "Mode silence sur l'exercice : écran assombri, timer seul, aperçu discret de la consigne.",
        "Option « Tenir compte de mon Fil » : le miroir peut croiser jusqu'à 5 traces locales (opt-in, sans photos).",
      ],
      en: [
        "Silent mode during the exercise: dimmed screen, timer alone, a discreet glimpse of the brief.",
        "An opt-in “Take my Thread into account”: the mirror can draw on up to 5 local traces (no photos).",
      ],
    },
  },
  {
    id: "rituel-approfondi",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Rituel enrichi & Fil analytique",
      en: "A richer ritual & a Thread that reads back",
    },
    highlights: {
      fr: [
        "Énoncé d'exercice développé (consigne + paragraphe), contexte des modules visible sans être envoyé comme directive IA.",
        "Bouton Approfondir après le miroir, questions profondes personnalisables, techniques activables / personnalisées.",
        "Analyse IA possible pour vidéo / musique / danse / théâtre avec une clé perso ; export PDF en fin d'exercice ; analyse croisée du Fil (max 5).",
      ],
      en: [
        "A fuller exercise brief (instruction plus a paragraph); module context stays visible without being sent to the AI as an instruction.",
        "A “Go deeper” button after the mirror, customisable deep questions, and techniques you can enable or create.",
        "AI reading for video / music / dance / theatre with your own key; PDF export at the end of an exercise; a cross-reading of the Thread (up to 5).",
      ],
    },
  },
  {
    id: "creative-watermelon",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Identité Creative Watermelon",
      en: "The Creative Watermelon identity",
    },
    highlights: {
      fr: [
        "Nouvelle palette crème, pastèque et écorce sage — landing et app plus chaleureuses.",
        "Navigation clarifiée : Exercices, Espace créatif, Config IA, À propos + CTA « Commencer ».",
        "Badges 100 % local / BYOK visibles sur l’accueil et dans les moteurs IA.",
      ],
      en: [
        "A new cream, watermelon and sage-rind palette — a warmer landing page and app.",
        "Clearer navigation: Exercises, Creative space, AI setup, About, plus a “Start” call to action.",
        "100% local / BYOK badges visible on the home page and in the AI engines screen.",
      ],
    },
  },
  {
    id: "exercice-creatif",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Positionnement exercices créatifs",
      en: "Positioned around creative exercises",
    },
    highlights: {
      fr: [
        "Le langage produit parle d’exercices et de rituels créatifs — sans se présenter comme de l’art-thérapie clinique.",
        "Prompts IA et écrans mis à jour : coach / miroir créatif, disclaimer inchangé (ne remplace pas une thérapie).",
        "Landing et SEO recentrés sur le geste, le jeu et le lâcher-prise.",
      ],
      en: [
        "The product language speaks of creative exercises and rituals — never presenting itself as clinical art therapy.",
        "AI prompts and screens updated: creative coach / mirror, with the same disclaimer (not a replacement for therapy).",
        "Landing page and SEO refocused on gesture, play and letting go.",
      ],
    },
  },
  {
    id: "local-first-drive",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Local-first & sauvegarde Google Drive",
      en: "Local-first & Google Drive backup",
    },
    highlights: {
      fr: [
        "Plus de mur de connexion ni de compte Pastek obligatoire : l’app fonctionne d’abord sur l’appareil.",
        "Sauvegarde et restauration du Fil via Google Drive côté client (OAuth local), sans sync serveur des traces.",
        "Vos rituels restent chez vous ; le cloud n’est qu’une option de backup.",
      ],
      en: [
        "No sign-in wall and no mandatory Pastek account: the app works on your device first.",
        "Back up and restore the Thread through Google Drive on the client side (local OAuth), with no server sync of your traces.",
        "Your rituals stay with you; the cloud is only a backup option.",
      ],
    },
  },
  {
    id: "byok-moteurs",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Vos clés IA (BYOK) & moteurs souverains",
      en: "Your own AI keys (BYOK) & sovereign engines",
    },
    highlights: {
      fr: [
        "Apportez votre propre clé API : elle reste sur l’appareil et n’est jamais stockée par Pastek Art.",
        "Fournisseurs européens & souverains : Mistral, Scaleway, OVHcloud, Aleph Alpha, Ollama (local).",
        "Fournisseurs globaux : OpenAI, Anthropic (Claude), Google Gemini — avec test de connexion dans les réglages.",
      ],
      en: [
        "Bring your own API key: it stays on your device and is never stored by Pastek Art.",
        "European & sovereign providers: Mistral, Scaleway, OVHcloud, Aleph Alpha, Ollama (local).",
        "Global providers: OpenAI, Anthropic (Claude), Google Gemini — with a connection test in the settings.",
      ],
    },
  },
  {
    id: "gratuit-prompts",
    dateLabel: { fr: "août 2026", en: "August 2026" },
    title: {
      fr: "Accès libre & prompts personnalisables",
      en: "Free access & customisable prompts",
    },
    highlights: {
      fr: [
        "Le générateur est utilisable sans crédits Premium : mode gratuit (Hugging Face) ou votre clé personnelle.",
        "Consultation et personnalisation locale des prompts système (exercice, miroir, vision, OCR).",
        "Export PDF des rituels du Fil avec la photo de votre création.",
      ],
      en: [
        "The generator works without Premium credits: free mode (Hugging Face) or your own key.",
        "Read and edit the system prompts on your device (exercise, mirror, vision, OCR).",
        "PDF export of Thread rituals, including the photo of your work.",
      ],
    },
  },
  {
    id: "assistant-palette",
    dateLabel: { fr: "juillet 2026", en: "July 2026" },
    title: {
      fr: "Assistant palette peinture",
      en: "Painting palette assistant",
    },
    highlights: {
      fr: [
        "L'ancienne Palette intérieure devient un assistant RYB : primaires, secondaires, tertiaires.",
        "Recettes de mélange et ratio 60·30·10 pour le dessin et la peinture.",
        "Conseils peinture personnalisés par IA à chaque étape.",
      ],
      en: [
        "The old Inner Palette becomes an RYB assistant: primaries, secondaries, tertiaries.",
        "Mixing recipes and the 60·30·10 ratio for drawing and painting.",
        "Personalised painting advice from the AI at every step.",
      ],
    },
  },
  {
    id: "express-profond",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: {
      fr: "Parcours Express & Profond",
      en: "Express & Deep journeys",
    },
    highlights: {
      fr: [
        "Choix du rythme dès l'impulsion : parcours rapide ou guidé en profondeur.",
        "Mode Profond : questionnaire d'ancrage avant le miroir créatif, puis pistes d'intégration pour clore la séance.",
        "Passerelle discrète depuis l'express pour basculer vers le profond à la réflexion.",
      ],
      en: [
        "Choose your pace right from the impulse: a quick path or a deeply guided one.",
        "Deep mode: grounding questions before the creative mirror, then ways to integrate what came up.",
        "A quiet bridge from express to deep at the reflection step.",
      ],
    },
  },
  {
    id: "sur-mesure",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: {
      fr: "Mode Sur-Mesure & second tour augmenté",
      en: "Custom mode & a richer second round",
    },
    highlights: {
      fr: [
        "Nouveau parcours personnalisé : filtres, tags et intention pour générer un exercice sur mesure.",
        "Second tour de création enrichi selon ce qui a évolué pendant la réflexion.",
        "Passerelle express → profond renforcée pour prolonger une séance déjà commencée.",
      ],
      en: [
        "A new tailored path: filters, tags and intention to generate an exercise made for you.",
        "A second round of making, shaped by what shifted during the reflection.",
        "A stronger express → deep bridge to extend a session already under way.",
      ],
    },
  },
  {
    id: "site-seo",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: {
      fr: "Site pastek-art.eu & application sous /app",
      en: "The pastek-art.eu site & the app under /app",
    },
    highlights: {
      fr: [
        "Page d'accueil SEO à la racine du domaine, avec présentation des exercices créatifs.",
        "Application interactive déplacée sous /app pour séparer marketing et outil.",
        "Logo et baseline cliquables pour revenir à l'accueil du site.",
      ],
      en: [
        "An SEO home page at the domain root, introducing the creative exercises.",
        "The interactive app moved under /app, separating the marketing site from the tool.",
        "Clickable logo and tagline to get back to the site home.",
      ],
    },
  },
  {
    id: "fil-memoire",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: {
      fr: "Fil créatif & mémoire des pratiques",
      en: "The Creative Thread & a memory of your practice",
    },
    highlights: {
      fr: [
        "Enregistrement automatique de chaque rituel et amorce dans le Fil créatif.",
        "Export et restauration manuelle de votre Fil (fichier local, sans compte).",
        "Vue détaillée par trace : impulsion, technique, réflexion et source.",
      ],
      en: [
        "Every ritual and starter is saved automatically to the Creative Thread.",
        "Export and restore your Thread by hand (a local file, no account).",
        "A detailed view for each trace: impulse, technique, reflection and source.",
      ],
    },
  },
  {
    id: "identite-pastek",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: {
      fr: "Identité visuelle Pastek Art",
      en: "The Pastek Art visual identity",
    },
    highlights: {
      fr: [
        "Refonte complète : typographies Lora & Nunito Sans, palette crème et sauge.",
        "Accueil repensé avec modules en cartes, CTA rituel mis en avant.",
        "Boutons pill, icônes unifiées et design cohérent sur tous les écrans.",
      ],
      en: [
        "A full redesign: Lora & Nunito Sans typefaces, a cream and sage palette.",
        "A reworked home screen with module cards and the ritual call to action up front.",
        "Pill buttons, unified icons and a consistent design across every screen.",
      ],
    },
  },
  {
    id: "explorateur-emotionnel",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: { fr: "Explorateur émotionnel", en: "Emotion explorer" },
    highlights: {
      fr: [
        "Amorce inspirée des cartes de ressenti : quatre zones, un mot précis.",
        "Quadrant neutre et animations douces pour parcourir les émotions sans jugement.",
        "Enchaînement direct vers le rituel créatif.",
      ],
      en: [
        "A starter inspired by feeling cards: four zones, one precise word.",
        "A neutral quadrant and gentle animations to move through emotions without judgement.",
        "A direct step into the creative ritual.",
      ],
    },
  },
  {
    id: "parcours-rituel",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: { fr: "Parcours rituel clarifié", en: "A clearer ritual journey" },
    highlights: {
      fr: [
        "Barre Impulsion · Exercice · Réflexion sur tout le flux.",
        "Mots-clés visibles dès l'exercice, timer zen précis avec son de fin configurable.",
        "Écran réflexion repensé : miroir créatif, questions ouvertes et suivi d'exercice séparés.",
      ],
      en: [
        "An Impulse · Exercise · Reflection bar across the whole flow.",
        "Keywords visible from the exercise on, and a precise calm timer with a configurable end sound.",
        "A reworked reflection screen: creative mirror, open questions and follow-up exercise kept apart.",
      ],
    },
  },
  {
    id: "amorces",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: { fr: "Amorces créatives", en: "Creative starters" },
    highlights: {
      fr: [
        "Palette intérieure : trois teintes, miroir chromatique IA optionnel.",
        "Ping-Pong créatif : amorce rapide en quelques mots.",
        "Chercheur de Nuances : lotus élémentaires et pont rituel ou exercice.",
      ],
      en: [
        "Inner Palette: three shades, with an optional AI chromatic mirror.",
        "Creative Ping-Pong: a quick starter in a few words.",
        "Nuance Seeker: elemental lotuses and a bridge to a ritual or an exercise.",
      ],
    },
  },
  {
    id: "mvp-fil",
    dateLabel: { fr: "juin 2026", en: "June 2026" },
    title: {
      fr: "Lancement du générateur d'exercices",
      en: "The exercise generator launches",
    },
    highlights: {
      fr: [
        "Rituel en trois temps : impulsion, exercice chronométré, capture & réflexion.",
        "Génération d'exercices par IA (Hugging Face) avec repli local hors ligne.",
        "Onze techniques artistiques, durées 15 / 30 / 45 minutes.",
      ],
      en: [
        "A ritual in three movements: impulse, timed exercise, capture & reflection.",
        "AI-generated exercises (Hugging Face) with a local offline fallback.",
        "Eleven art techniques, and 15 / 30 / 45 minute lengths.",
      ],
    },
  },
];

export function getChangelog(language: AppLanguage): ChangelogEntry[] {
  return CHANGELOG_CATALOG.map((entry) => ({
    id: entry.id,
    dateLabel: entry.dateLabel[language],
    title: entry.title[language],
    highlights: entry.highlights[language],
  }));
}
