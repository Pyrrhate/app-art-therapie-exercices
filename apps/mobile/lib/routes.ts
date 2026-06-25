/** Préfixe des routes de l'application interactive. */
export const APP_BASE = "/app";

export const ROUTES = {
  /** Page marketing (pastek-art.eu). */
  landing: "/",
  examples: "/exemples",
  example: (slug: string) => `/exemples/${slug}`,
  home: APP_BASE,
  ritual: `${APP_BASE}/ritual`,
  custom: `${APP_BASE}/custom`,
  exercise: `${APP_BASE}/exercise`,
  reflection: `${APP_BASE}/reflection`,
  settings: `${APP_BASE}/settings`,
  privacy: `${APP_BASE}/privacy`,
  changelog: `${APP_BASE}/maj`,
  fil: `${APP_BASE}/fil`,
  filEntry: (id: string) => `${APP_BASE}/fil/${id}`,
  pingPong: `${APP_BASE}/ping-pong`,
  colorJourney: `${APP_BASE}/color-journey`,
  nuanceFinder: `${APP_BASE}/nuance-finder`,
  emotionExplorer: `${APP_BASE}/emotion-explorer`,
} as const;

export type ModuleAmorceRoute =
  | typeof ROUTES.pingPong
  | typeof ROUTES.colorJourney
  | typeof ROUTES.nuanceFinder
  | typeof ROUTES.emotionExplorer;

export function isAppHomePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === APP_BASE || normalized === `${APP_BASE}/index`;
}

export function isLandingPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === "/" || normalized === "/index";
}

export function isAppPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === APP_BASE || normalized.startsWith(`${APP_BASE}/`);
}
