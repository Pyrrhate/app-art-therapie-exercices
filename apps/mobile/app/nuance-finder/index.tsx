import { Text } from "react-native";
import { NuanceFinder } from "@/components/nuance-finder/NuanceFinder";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { navigateHome } from "@/lib/navigation";

export default function NuanceFinderScreen() {
  return (
    <ScreenContainer scrollable refreshable>
      <ScreenNavBar
        backLabel="← Accueil"
        onBack={navigateHome}
      />

      <Text className="text-sage-500 text-sm uppercase tracking-widest mb-3">
        Le Chercheur de Nuances
      </Text>
      <Text className="text-3xl font-light text-sand-800 mb-2 leading-tight">
        Chromatique, sans pression
      </Text>
      <Text className="text-sand-500 text-base leading-6 mb-6">
        Un petit puzzle de couleurs dans l&apos;application. Pas de score, pas
        de chrono — seulement la découverte douce des teintes.
      </Text>

      <NuanceFinder />
    </ScreenContainer>
  );
}
