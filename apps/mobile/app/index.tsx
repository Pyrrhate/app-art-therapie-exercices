import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";

export default function WelcomeScreen() {
  return (
    <ScreenContainer scrollable>
      <View className="gap-4 pb-4">
        <View>
          <Text className="text-sage-500 text-sm uppercase tracking-widest mb-4">
            Art Thérapie
          </Text>
          <Text className="text-4xl font-light text-sand-800 mb-4 leading-tight">
            Un rituel créatif,{"\n"}en douceur
          </Text>
          <Text className="text-base text-sand-500 leading-7 mb-10">
            Trois étapes simples : une impulsion, un exercice guidé, puis une
            réflexion bienveillante sur votre création. Vos données restent sur
            cet appareil.
          </Text>

          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-4">
            <Text className="text-sand-700 font-medium mb-3">
              Comment ça marche ?
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-2">
              1. Choisissez une impulsion et une technique
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-2">
              2. Créez pendant le temps qui vous convient
            </Text>
            <Text className="text-sand-600 text-sm leading-6">
              3. Photographiez votre œuvre et recevez un miroir créatif
            </Text>
          </View>

          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-6">
            <Text className="text-sand-700 font-medium mb-3">
              Modules créatifs
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-2">
              Studio Mandala — coloriage procédural, 100 % hors ligne
            </Text>
            <Text className="text-sand-600 text-sm leading-6">
              Ping-Pong créatif — chaîne de mots pour trouver une impulsion
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
