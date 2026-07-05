import { Platform } from "react-native";
import Head from "expo-router/head";
import { Stack } from "expo-router";
import { NotFoundPage } from "@/components/marketing/NotFoundPage";

/** Filet de sécurité si +not-found n'est pas déclenché (SPA / routes inconnues). */
export default function UnmatchedCatchAllScreen() {
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
