import { Pressable, Text, View } from "react-native";
import { navigateBackOrHome, navigateHome } from "@/lib/navigation";

interface ScreenNavBarProps {
  /** Libellé du lien retour (défaut : « ← Retour ») */
  backLabel?: string;
  /** Action retour personnalisée */
  onBack?: () => void;
  /** Afficher le lien « Accueil » à droite (défaut : oui) */
  showHome?: boolean;
}

export function ScreenNavBar({
  backLabel = "← Retour",
  onBack = navigateBackOrHome,
  showHome = true,
}: ScreenNavBarProps) {
  return (
    <View className="flex-row justify-between items-center mb-4 -mt-2">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
      >
        <Text className="text-sage-500 text-base">{backLabel}</Text>
      </Pressable>
      {showHome ? (
        <Pressable
          onPress={navigateHome}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
          hitSlop={8}
        >
          <Text className="text-sand-500 text-sm font-medium">Accueil</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
}
