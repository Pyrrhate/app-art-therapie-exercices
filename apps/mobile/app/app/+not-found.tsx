import { Platform } from "react-native";
import Head from "expo-router/head";
import { NotFoundPage } from "@/components/marketing/NotFoundPage";

export default function AppNotFoundScreen() {
  return (
    <>
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
