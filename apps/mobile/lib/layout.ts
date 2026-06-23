/** Alignement horizontal du contenu (ScreenContainer). */
export const SCREEN_CONTENT_PADDING_X = 24;
export const SCREEN_CONTENT_MAX_WIDTH = 720;
export const SCREEN_CONTENT_MAX_WIDTH_HOME = 920;

export function getScreenContentMaxWidth(pathname: string): number {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === "/" || normalized === "/index"
    ? SCREEN_CONTENT_MAX_WIDTH_HOME
    : SCREEN_CONTENT_MAX_WIDTH;
}
