import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { createSessionFromAuthUrl } from "@/lib/supabase/sessionFromUrl";
import { getSupabaseClient } from "@/lib/supabase/client";
import { showAlert } from "@/lib/alert";
import { screenBg, textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/** Point d'entrée OAuth / Magic Link (web et deep link natif). */
export default function AuthCallbackScreen() {
  const isDark = useIsDark();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      let connected = false;
      try {
        const href =
          typeof window !== "undefined" ? window.location.href : "";
        if (href) {
          connected = await createSessionFromAuthUrl(href);
          if (!connected) {
            const supabase = getSupabaseClient();
            const { data } = await supabase?.auth.getSession() ?? {
              data: { session: null },
            };
            connected = Boolean(data.session);
          }
        }

        if (!connected) {
          if (active) {
            setFailed(true);
            showAlert(
              "Connexion",
              "Le lien a expiré ou est invalide. Demandez un nouveau lien magique."
            );
          }
          return;
        }
      } catch (error) {
        console.warn("[auth/callback]", error);
        if (active) {
          setFailed(true);
          showAlert(
            "Connexion impossible",
            error instanceof Error ? error.message : "Réessayez dans un instant."
          );
        }
        return;
      }

      if (active) {
        router.replace("/app/fil");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (failed) {
    return (
      <View
        className={`flex-1 items-center justify-center px-8 ${screenBg(isDark)}`}
      >
        <Text className={`text-sm text-center leading-6 ${textMuted(isDark)}`}>
          Retournez aux Réglages pour demander un nouveau lien de connexion.
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`flex-1 items-center justify-center px-8 ${screenBg(isDark)}`}
    >
      <ActivityIndicator color="#496349" />
      <Text className={`mt-4 text-sm ${textMuted(isDark)}`}>
        Connexion en cours…
      </Text>
    </View>
  );
}
