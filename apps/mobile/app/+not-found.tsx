import { Platform } from "react-native";
import Head from "expo-router/head";
import { Stack } from "expo-router";
import { NotFoundPage } from "@/components/marketing/NotFoundPage";

export default function RootNotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      {Platform.OS === "web" ? (
        <Head>
          <title>Page introuvable | Pastek Art</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      ) : null}
      <NotFoundPage />
    </>
  );
}