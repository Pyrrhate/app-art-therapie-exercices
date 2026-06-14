import { Platform } from "react-native";
import { router } from "expo-router";

/** Retour à l'accueil — fiable même si l'historique de navigation est profond ou vide. */
export function navigateHome(): void {
  router.replace("/");
}

/** Retour arrière, ou accueil si la pile est vide (deep link, refresh, etc.). */
export function navigateBackOrHome(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    navigateHome();
  }
}

/** Recharge l'app (web) ou exécute un callback (natif). */
export async function refreshApplication(
  onNativeRefresh?: () => void | Promise<void>
): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    return;
  }
  await onNativeRefresh?.();
}

export function isWebPlatform(): boolean {
  return Platform.OS === "web";
}
