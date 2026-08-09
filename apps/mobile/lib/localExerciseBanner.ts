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
    return "Exercice local : votre clé n’a peut‑être pas été utilisée (API à redéployer sur Vercel) ou Mistral a refusé l’appel (plan / crédits sur console.mistral.ai).";
  }
  return "Mode local actif — exercice guidé hors ligne.";
}
