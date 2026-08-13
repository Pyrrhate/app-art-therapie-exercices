import { TECHNIQUE_LABELS, type ArtisticTechnique } from "@art-therapie/shared";
import i18n from "@/lib/i18n";

/**
 * Libellé de technique dans la langue de l'interface.
 * Un libellé personnalisé (technique ajoutée par l'utilisateur) est conservé tel quel.
 */
export function localizedTechniqueLabel(
  id: string | null | undefined,
  customLabel?: string | null
): string {
  if (!id) return customLabel ?? "";
  const builtinLabel = TECHNIQUE_LABELS[id as ArtisticTechnique];
  if (customLabel && customLabel !== builtinLabel) return customLabel;
  const translated = i18n.t(`ritual:techniques.${id}`, { defaultValue: "" });
  return translated || builtinLabel || id;
}
