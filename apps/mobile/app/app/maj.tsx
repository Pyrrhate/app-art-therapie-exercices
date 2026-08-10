import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { ROUTES } from "@/lib/routes";

/** Ancienne URL /app/maj → page site /maj. */
export default function AppMajRedirect() {
  useEffect(() => {
    router.replace(ROUTES.changelog);
  }, []);

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.replace(ROUTES.changelog);
  }

  return null;
}
