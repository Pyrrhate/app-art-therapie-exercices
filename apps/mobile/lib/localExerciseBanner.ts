/**
 * Texte du bandeau quand l'exercice vient du mode local / fallback.
 */
export function localExerciseBannerMessage(opts: {
  fallbackNote?: string | null;
  byokConfigured?: boolean;
}): string {
  const note = opts.fallbackNote?.trim();
  if (note) return note;
  if (opts.byokConfigured) {
    return "Votre clé IA n’a pas pu générer l’exercice (clé invalide, quota ou réponse inattendue). Exercice guidé local affiché.";
  }
  return "Mode local actif — exercice guidé hors ligne.";
}
