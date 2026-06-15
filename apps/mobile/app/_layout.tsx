import "../global.css";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { WebErrorBoundary } from "@/components/WebErrorBoundary";

if (Platform.OS === "web") {
  enableScreens(false);
}

export default function RootLayout() {
  return (
    <WebErrorBoundary>
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            ...(Platform.OS === "web"
              ? { minHeight: "100vh", width: "100%" }
              : null),
          }}
        >
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#FAF7F4",
                flex: 1,
              },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="ritual" />
            <Stack.Screen name="mandala/index" options={{ title: "Mandala" }} />
            <Stack.Screen name="mandala/studio" />
            <Stack.Screen name="ping-pong/index" />
            <Stack.Screen name="nuance-finder/index" />
            <Stack.Screen name="color-journey/index" options={{ title: "Palette intérieure" }} />
            <Stack.Screen name="fil/index" options={{ title: "Fil créatif" }} />
            <Stack.Screen name="exercise" />
            <Stack.Screen name="reflection" />
            <Stack.Screen
              name="sessions/index"
              options={
                Platform.OS === "web"
                  ? { presentation: "card" }
                  : { presentation: "modal" }
              }
            />
            <Stack.Screen name="sessions/[id]" />
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
        </View>
      </SafeAreaProvider>
    </WebErrorBoundary>
  );
}
