/**
 * Expo Router (SDK 52) ajoute parfois `?__EXPO_ROUTER_key=…` dans l'URL web.
 * Ce paramètre est interne ; on le retire de la barre d'adresse sans recharger.
 * Corrigé nativement à partir de SDK 53 — à retirer après upgrade.
 */
import { useEffect } from "react";
import { Platform } from "react-native";
import { usePathname, useGlobalSearchParams } from "expo-router";

const KEY = "__EXPO_ROUTER_key";

function stripExpoRouterKeyFromHref(href: string): string {
  try {
    const url = new URL(href, window.location.origin);
    if (!url.searchParams.has(KEY)) return href;
    url.searchParams.delete(KEY);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function cleanCurrentUrl(): void {
  if (typeof window === "undefined") return;
  if (!window.location.href.includes(KEY)) return;
  const next = stripExpoRouterKeyFromHref(window.location.href);
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(window.history.state, "", next);
  }
}

/**
 * Composant no-op à monter une fois dans le layout racine (web uniquement).
 */
export function CleanExpoRouterUrl(): null {
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history
    );

    window.history.pushState = (data, unused, url) => {
      const cleaned =
        typeof url === "string" ? stripExpoRouterKeyFromHref(url) : url;
      return originalPushState(data, unused, cleaned);
    };

    window.history.replaceState = (data, unused, url) => {
      const cleaned =
        typeof url === "string" ? stripExpoRouterKeyFromHref(url) : url;
      return originalReplaceState(data, unused, cleaned);
    };

    cleanCurrentUrl();
    const t0 = window.setTimeout(cleanCurrentUrl, 0);
    const t1 = window.setTimeout(cleanCurrentUrl, 50);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    cleanCurrentUrl();
    const t = window.setTimeout(cleanCurrentUrl, 0);
    return () => window.clearTimeout(t);
  }, [pathname, params]);

  return null;
}
