import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { NuanceFinder } from "@/components/nuance-finder/NuanceFinder";
import { ScreenContainer } from "@/components/ui/Button";

export default function NuanceFinderScreen() {
  return (
    <ScreenContainer scrollable>
      <Pressable onPress={() => router.back()} className="mb-4 -mt-2">
        <Text className="text-sage-500 text-base">← Accueil</Text>
      </Pressable>

      <Text className="text-sage-500 text-sm uppercase tracking-widest mb-3">
        Le Chercheur de Nuances
      </Text>
      <Text className="text-3xl font-light text-sand-800 mb-2 leading-tight">
        Chromatique, sans pression
      </Text>
      <Text className="text-sand-500 text-base leading-6 mb-6">
        Un petit puzzle de couleurs, 100 % hors ligne. Pas de score, pas de
        chrono — seulement la découverte douce des teintes.
      </Text>

      <NuanceFinder />
    </ScreenContainer>
  );
}
