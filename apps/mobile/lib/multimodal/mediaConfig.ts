import type { ExpressionMediaType } from "@/lib/multimodal/types";

export interface MediaTypeConfig {
  id: ExpressionMediaType;
  title: string;
  subtitle: string;
  examples: string;
  icon: string;
  iconLabel: string;
  acceptWeb: string;
  extensions: readonly string[];
  mimePrefixes: readonly string[];
  dropHint: string;
}

export const MEDIA_TYPE_CONFIG: Record<ExpressionMediaType, MediaTypeConfig> = {
  visual: {
    id: "visual",
    title: "Arts visuels",
    subtitle: "Dessin, peinture, collage, recycl'art",
    examples: "Dessin · Peinture · Collage · Recycl'art",
    icon: "◐",
    iconLabel: "Icône arts visuels",
    acceptWeb: "image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png",
    extensions: [".jpg", ".jpeg", ".png"],
    mimePrefixes: ["image/jpeg", "image/png", "image/jpg"],
    dropHint: "Glissez une image (.jpg, .png) ou cliquez pour parcourir",
  },
  corporeal: {
    id: "corporeal",
    title: "Expression corporelle & scénique",
    subtitle: "Danse, théâtre, mime, performance",
    examples: "Danse · Théâtre · Mime · Performance",
    icon: "◇",
    iconLabel: "Icône expression corporelle",
    acceptWeb: "video/mp4,video/quicktime,.mp4,.mov",
    extensions: [".mp4", ".mov"],
    mimePrefixes: ["video/mp4", "video/quicktime"],
    dropHint: "Glissez une vidéo (.mp4, .mov) ou cliquez pour parcourir",
  },
  sonic: {
    id: "sonic",
    title: "Création sonore",
    subtitle: "Musique, chant, improvisation instrumentale",
    examples: "Musique · Chant · Improvisation",
    icon: "〰",
    iconLabel: "Icône création sonore",
    acceptWeb: "audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a",
    extensions: [".mp3", ".wav", ".m4a"],
    mimePrefixes: ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"],
    dropHint: "Glissez un fichier audio (.mp3, .wav, .m4a) ou cliquez pour parcourir",
  },
};

export const MEDIA_TYPE_ORDER: ExpressionMediaType[] = [
  "visual",
  "corporeal",
  "sonic",
];

export function isFileAllowedForMedia(
  fileName: string,
  mimeType: string,
  mediaType: ExpressionMediaType
): boolean {
  const config = MEDIA_TYPE_CONFIG[mediaType];
  const lower = fileName.toLowerCase();
  const extOk = config.extensions.some((ext) => lower.endsWith(ext));
  const mimeLower = mimeType.toLowerCase();
  const mimeOk = config.mimePrefixes.some(
    (prefix) => mimeLower === prefix || mimeLower.startsWith(prefix)
  );
  return extOk || mimeOk;
}
