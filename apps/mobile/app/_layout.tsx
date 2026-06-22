import "../global.css";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { ThemeRoot } from "@/components/ThemeRoot";
import { WebErrorBoundary } from "@/components/WebErrorBoundary";
import { THEME_COLORS, useThemeStore } from "@/lib/themeStore";

if (Platform.OS === "web") {
  enableScreens(false);
}

function RootStack() {
  const theme = useThemeStore((s) => s.theme);
  const bg = THEME_COLORS[theme].root;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: bg,
          flex: 1,
          ...(Platform.OS === "web" ? { minHeight: 0 } : null),
        },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="ritual" />
      <Stack.Screen name="ping-pong/index" />
      <Stack.Screen name="nuance-finder/index" />
      <Stack.Screen
        name="emotion-explorer/index"
        options={{ title: "Explorateur émotionnel" }}
      />
      <Stack.Screen
        name="color-journey/index"
        options={{ title: "Palette intérieure" }}
      />
      <Stack.Screen name="fil/index" options={{ title: "Fil créatif" }} />
      <Stack.Screen name="fil/[id]" />
      <Stack.Screen name="exercise" />
      <Stack.Screen name="reflection" />
      <Stack.Screen
        name="settings"
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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <WebErrorBoundary>
      <SafeAreaProvider>
        <ThemeRoot>
          <RootStack />
        </ThemeRoot>
      </SafeAreaProvider>
    </WebErrorBoundary>
  );
}
