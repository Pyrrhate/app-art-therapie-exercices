import { Text, View } from "react-native";
import { NuanceFinder } from "@/components/nuance-finder/NuanceFinder";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { navigateHome } from "@/lib/navigation";

export default function NuanceFinderScreen() {
  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720}>
      <ScreenNavBar backLabel="← Retour" onBack={navigateHome} />

      <PastekScreenHero
        label="Le Chercheur de Nuances"
        title={"Affiner le regard,\n"}
        accent="puis créer"
        description="Une autre façon d'aborder la couleur — un jeu visuel procédural sans IA. Une grille 8×8 pour découvrir les teintes à votre rythme, prélude à la création. Pas de score, pas de chrono."
        className="mb-8"
      />

      <NuanceFinder />
    </ScreenContainer>
  );
}
