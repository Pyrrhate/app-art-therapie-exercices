import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

export default function AppStackLayout() {
  const { t } = useTranslation("app");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: Platform.OS === "web" ? { minHeight: 0 } : undefined,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="ritual" />
      <Stack.Screen
        name="custom"
        options={{ title: t("screens.custom") }}
      />
      <Stack.Screen name="ping-pong/index" />
      <Stack.Screen name="nuance-finder/index" />
      <Stack.Screen
        name="emotion-explorer/index"
        options={{ title: t("screens.emotionExplorer") }}
      />
      <Stack.Screen
        name="color-journey/index"
        options={{ title: t("screens.colorJourney") }}
      />
      <Stack.Screen
        name="three-gestures/index"
        options={{ title: t("screens.threeGestures") }}
      />
      <Stack.Screen
        name="one-rule/index"
        options={{ title: t("screens.oneRule") }}
      />
      <Stack.Screen name="fil/index" options={{ title: t("screens.fil") }} />
      <Stack.Screen name="fil/[id]" />
      <Stack.Screen name="saisons/index" options={{ title: t("screens.seasons") }} />
      <Stack.Screen name="exercise" />
      <Stack.Screen name="reflection" />
      <Stack.Screen
        name="settings/index"
        options={
          Platform.OS === "web"
            ? { presentation: "card" }
            : { presentation: "modal" }
        }
      />
      <Stack.Screen
        name="settings/ai-engines"
        options={
          Platform.OS === "web"
            ? { presentation: "card", title: t("screens.aiEngines") }
            : { presentation: "modal", title: t("screens.aiEngines") }
        }
      />
      <Stack.Screen
        name="settings/prompts"
        options={
          Platform.OS === "web"
            ? { presentation: "card", title: t("screens.prompts") }
            : { presentation: "modal", title: t("screens.prompts") }
        }
      />
      <Stack.Screen
        name="settings/prompt-lab"
        options={
          Platform.OS === "web"
            ? { presentation: "card", title: t("screens.promptLab") }
            : { presentation: "modal", title: t("screens.promptLab") }
        }
      />
      <Stack.Screen
        name="premium-cloud"
        options={
          Platform.OS === "web"
            ? { presentation: "card" }
            : { presentation: "modal" }
        }
      />
      <Stack.Screen
        name="privacy"
        options={
          Platform.OS === "web"
            ? { presentation: "card" }
            : { presentation: "modal" }
        }
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
