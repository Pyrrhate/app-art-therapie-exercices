import i18n from "@/lib/i18n";

export function buildLocalNuanceMirror(payload: {
  colors: Array<{ label: string }>;
  harmonyName?: string;
  discoveredElements?: string[];
}): string {
  const names = payload.colors.map((c) => c.label).slice(0, 5).join(", ");
  const harmony = payload.harmonyName?.trim();

  if (harmony && names) {
    return i18n.t("amorces:nuanceFinder.mirror.named", { harmony, names });
  }
  if (names) {
    return i18n.t("amorces:nuanceFinder.mirror.tones", { names });
  }
  return i18n.t("amorces:nuanceFinder.mirror.empty");
}
