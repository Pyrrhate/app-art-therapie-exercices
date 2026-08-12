import { isAppHomePath } from "@/lib/routes";

/** Alignement horizontal unique site / app / réglages (px). */
export const SCREEN_CONTENT_PADDING_X = 24;
export const SCREEN_CONTENT_MAX_WIDTH = 720;
/** @deprecated Alias — même largeur partout. */
export const SCREEN_CONTENT_MAX_WIDTH_HOME = SCREEN_CONTENT_MAX_WIDTH;

export function getScreenContentMaxWidth(_pathname?: string): number {
  return SCREEN_CONTENT_MAX_WIDTH;
}

/** Classe Tailwind équivalente pour pages marketing / web. */
export const CONTENT_MAX_WIDTH_CLASS = "max-w-3xl";
