const POETIC_WORDS = [
  "brume",
  "racine",
  "horizon",
  "silence",
  "souffle",
  "lumière",
  "mousse",
  "reflet",
  "velours",
  "écho",
  "marée",
  "pétales",
  "clairière",
  "éclat",
  "murmure",
  "ocre",
  "douceur",
  "frisson",
  "aurore",
  "rivière",
  "nuage",
  "miel",
  "forêt",
  "pierre",
  "vent",
];

const ASSOCIATIONS: Record<string, string[]> = {
  eau: ["rivière", "marée", "reflet", "brume", "silence"],
  feu: ["éclat", "aurore", "miel", "frisson", "lumière"],
  terre: ["racine", "pierre", "ocre", "mousse", "forêt"],
  air: ["vent", "nuage", "horizon", "écho", "souffle"],
  rouge: ["éclat", "frisson", "aurore", "miel", "velours"],
  bleu: ["rivière", "reflet", "brume", "silence", "horizon"],
  vert: ["mousse", "forêt", "clairière", "racine", "douceur"],
};

function normalize(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function getFallbackPingPongWord(
  userWord: string,
  history: string[]
): string {
  const used = new Set(
    [...history, userWord].map((w) => normalize(w)).filter(Boolean)
  );
  const key = normalize(userWord);
  const pool =
    ASSOCIATIONS[key] ??
    Object.entries(ASSOCIATIONS).find(([k]) => key.includes(k))?.[1] ??
    POETIC_WORDS;

  for (const candidate of pool) {
    if (!used.has(normalize(candidate))) {
      return candidate;
    }
  }

  for (const candidate of POETIC_WORDS) {
    if (!used.has(normalize(candidate))) {
      return candidate;
    }
  }

  return "souffle";
}
