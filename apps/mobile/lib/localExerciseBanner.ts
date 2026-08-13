import i18n from "@/lib/i18n";

/**
 * Texte du bandeau quand l'exercice vient du mode local / fallback.
 */
export function localExerciseBannerMessage(opts: {
  fallbackNote?: string | null;
  byokConfigured?: boolean;
}): string {
  const note = opts.fallbackNote?.trim();
  if (note) return note;
  return i18n.t(
    opts.byokConfigured ? "ritual:localBanner.byok" : "ritual:localBanner.offline"
  );
}
