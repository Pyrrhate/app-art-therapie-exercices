import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { createSessionFromAuthUrl } from "@/lib/supabase/sessionFromUrl";
import { screenBg, textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/** Point d'entrée OAuth / Magic Link (web et deep link natif). */
export default function AuthCallbackScreen() {
  const isDark = useIsDark();

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        if (typeof window !== "undefined") {
          await createSessionFromAuthUrl(window.location.href);
        }
      } catch (error) {
        console.warn("[auth/callback]", error);
      } finally {
        if (active) {
          router.replace("/app/fil");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View className={`flex-1 items-center justify-center px-8 ${screenBg(isDark)}`}>
      <ActivityIndicator color="#496349" />
      <Text className={`mt-4 text-sm ${textMuted(isDark)}`}>
        Connexion en cours…
      </Text>
    </View>
  );
}
