import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AppStackLayout() {
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
        options={{ title: "Mode Sur-Mesure" }}
      />
      <Stack.Screen name="ping-pong/index" />
      <Stack.Screen name="nuance-finder/index" />
      <Stack.Screen
        name="emotion-explorer/index"
        options={{ title: "Explorateur émotionnel" }}
      />
      <Stack.Screen
        name="color-journey/index"
        options={{ title: "Assistant palette" }}
      />
      <Stack.Screen name="fil/index" options={{ title: "Fil créatif" }} />
      <Stack.Screen name="fil/[id]" />
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
            ? { presentation: "card", title: "Moteurs IA" }
            : { presentation: "modal", title: "Moteurs IA" }
        }
      />
      <Stack.Screen
        name="settings/prompts"
        options={
          Platform.OS === "web"
            ? { presentation: "card", title: "Prompts IA" }
            : { presentation: "modal", title: "Prompts IA" }
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
      <Stack.Screen
        name="maj"
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
