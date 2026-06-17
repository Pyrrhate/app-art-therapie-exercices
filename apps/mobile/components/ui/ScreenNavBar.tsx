import { Pressable, Text, View } from "react-native";
import { navigateBackOrHome, navigateHome } from "@/lib/navigation";

interface ScreenNavBarProps {
  /** Libellé du lien retour (défaut : « ← Retour ») */
  backLabel?: string;
  /** Action retour personnalisée */
  onBack?: () => void;
  /** Afficher le lien « Accueil » à droite (défaut : oui) */
  showHome?: boolean;
  /** Contraste sur fond sombre */
  tone?: "default" | "light";
}

export function ScreenNavBar({
  backLabel = "← Retour",
  onBack = navigateBackOrHome,
  showHome = true,
  tone = "default",
}: ScreenNavBarProps) {
  const backClass = tone === "light" ? "text-sage-300" : "text-sage-500";
  const homeClass = tone === "light" ? "text-sand-300" : "text-sand-500";

  return (
    <View className="flex-row justify-between items-center mb-4 -mt-2">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
      >
        <Text className={`${backClass} text-base`}>{backLabel}</Text>
      </Pressable>
      {showHome ? (
        <Pressable
          onPress={navigateHome}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
          hitSlop={8}
        >
          <Text className={`${homeClass} text-sm font-medium`}>Accueil</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
}
