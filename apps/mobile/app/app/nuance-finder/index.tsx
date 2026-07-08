import { Text, View } from "react-native";
import { NuanceFinder } from "@/components/nuance-finder/NuanceFinder";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { navigateHome } from "@/lib/navigation";

export default function NuanceFinderScreen() {
  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720} compactTop>
      <ScreenNavBar backLabel="← Retour" onBack={navigateHome} />

      <PastekScreenHero
        label="Le Chercheur de Nuances"
        title={"Affiner le regard,\n"}
        accent="puis créer"
        description="Découvrez terre, feu et eau cachés dans la grille — nommez votre harmonie, puis choisissez rituel ou exercice."
        className="mb-8"
      />

      <NuanceFinder />
    </ScreenContainer>
  );
}
