import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SupportButton } from "@/components/SupportButton";

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-sand-50 px-6 pt-16 pb-8">
      <Pressable onPress={() => router.back()} className="mb-8">
        <Text className="text-sage-500 text-base">← Retour</Text>
      </Pressable>

      <Text className="text-3xl font-light text-sand-800 mb-2">Paramètres</Text>
      <Text className="text-sand-500 text-base mb-10 leading-6">
        Vos créations restent sur votre appareil. Aucun compte requis.
      </Text>

      <View className="gap-6">
        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">
            Stockage local
          </Text>
          <Text className="text-sand-500 text-sm leading-5">
            Toutes vos sessions sont enregistrées via AsyncStorage, uniquement
            sur cet appareil.
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">Confidentialité</Text>
          <Text className="text-sand-500 text-sm leading-5">
            Les photos envoyées pour la réflexion IA transitent par le serveur
            mais ne sont jamais stockées côté serveur.
          </Text>
        </View>

        <SupportButton />

        <Text className="text-sand-400 text-xs text-center mt-4">
          Art Thérapie · v0.1.0 · MVP
        </Text>
      </View>
    </View>
  );
}
