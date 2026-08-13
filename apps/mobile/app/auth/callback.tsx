import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { completeAuthFromCallbackUrl } from "@/lib/supabase/sessionFromUrl";
import { formatAuthError } from "@/lib/supabase/errors";
import { ensureCanonicalWebOrigin } from "@/lib/supabase/redirect";
import { showAlert } from "@/lib/alert";
import { screenBg, textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/** Point d'entrée OAuth / Magic Link (web et deep link natif). */
export default function AuthCallbackScreen() {
  const { t } = useTranslation("app");
  const isDark = useIsDark();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        if (!ensureCanonicalWebOrigin()) return;

        const href =
          typeof window !== "undefined" ? window.location.href : "";
        const connected = await completeAuthFromCallbackUrl(href);

        if (!connected) {
          if (active) {
            setFailed(true);
            showAlert(t("auth.signInAlertTitle"), t("auth.callbackFailedBody"));
          }
          return;
        }
      } catch (error) {
        console.warn("[auth/callback]", error);
        if (active) {
          setFailed(true);
          showAlert(t("auth.callbackImpossibleTitle"), formatAuthError(error));
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
  }, [t]);

  if (failed) {
    return (
      <View
        className={`flex-1 items-center justify-center px-8 ${screenBg(isDark)}`}
      >
        <Text className={`text-sm text-center leading-6 ${textMuted(isDark)}`}>
          {t("auth.callbackFailedHint")}
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
        {t("auth.callbackBusy")}
      </Text>
    </View>
  );
}
