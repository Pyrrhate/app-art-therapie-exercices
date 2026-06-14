import "../global.css";
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
            <Stack.Screen name="exercise" />
            <Stack.Screen name="reflection" />
            <Stack.Screen
              name="sessions"
              options={
                Platform.OS === "web"
                  ? { presentation: "card" }
                  : { presentation: "modal" }
              }
            />
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
