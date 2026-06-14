import { Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";

export default function WelcomeScreen() {
  return (
    <ScreenContainer scrollable refreshable>
      <View className="gap-4 pb-4">
        <View>
          <Text className="text-sage-500 text-sm uppercase tracking-widest mb-4">
            Art Thérapie
          </Text>
          <Text className="text-4xl font-light text-sand-800 mb-4 leading-tight">
            Un rituel créatif,{"\n"}en douceur
          </Text>
          <Text className="text-base text-sand-500 leading-7 mb-4">
            Parcours guidé par l&apos;IA, modules pour vous détendre, sessions
            sauvegardées localement sur cet appareil.
          </Text>
          {Platform.OS === "web" ? (
            <Text className="text-sand-400 text-xs leading-5 mb-8">
              Sur navigateur : F5 ou Ctrl+R pour actualiser la page.
            </Text>
          ) : (
            <Text className="text-sand-400 text-xs leading-5 mb-8">
              Tirez vers le bas pour actualiser l&apos;écran.
            </Text>
          )}

          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-4">
            <Text className="text-sand-700 font-medium mb-3">Au programme</Text>
            <Text className="text-sand-600 text-sm leading-6 mb-3">
              <Text className="font-medium text-sand-700">Rituel créatif</Text>
              {" — "}
              impulsion, exercice personnalisé, puis miroir bienveillant sur
              votre création (connexion pour l&apos;IA).
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-3">
              <Text className="font-medium text-sand-700">Studio Mandala</Text>
              {" — "}
              coloriage procédural à votre rythme, entièrement dans
              l&apos;application.
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-3">
              <Text className="font-medium text-sand-700">
                Ping-Pong créatif
              </Text>
              {" — "}
              chaîne de mots pour amorcer une impulsion (connexion pour l&apos;IA).
            </Text>
            <Text className="text-sand-600 text-sm leading-6">
              <Text className="font-medium text-sand-700">
                Chercheur de Nuances
              </Text>
              {" — "}
              puzzle chromatique apaisant, sans score ni chrono.
            </Text>
          </View>
        </View>

        <View className="gap-4 pt-4">
          <PrimaryButton
            label="Commencer un rituel"
            onPress={() => router.push("/ritual")}
          />
          <PrimaryButton
            label="Studio Mandala"
            onPress={() => router.push("/mandala")}
            variant="secondary"
          />
          <PrimaryButton
            label="Ping-Pong créatif"
            onPress={() => router.push("/ping-pong")}
            variant="secondary"
          />
          <PrimaryButton
            label="Chercheur de Nuances"
            onPress={() => router.push("/nuance-finder")}
            variant="secondary"
          />
          <PrimaryButton
            label="Mes sessions sauvegardées"
            onPress={() => router.push("/sessions")}
            variant="ghost"
          />
          <View className="flex-row justify-center gap-6 pt-2">
            <Pressable onPress={() => router.push("/settings")}>
              <Text className="text-sand-400 text-sm">Paramètres</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/privacy")}>
              <Text className="text-sand-400 text-sm">Confidentialité</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
