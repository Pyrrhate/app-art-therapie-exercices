import { Pressable, Text, View } from "react-native";
import { KofiDonateLink } from "@/components/ui/KofiDonateLink";
import { navigateBackOrHome, navigateHome } from "@/lib/navigation";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

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
  const isDark = useIsDark();

  return (
    <View className="flex-row justify-between items-center mb-4 -mt-2 gap-2">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        className="shrink min-w-0"
      >
        <Text className="text-sage-500 text-sm" numberOfLines={1}>
          {backLabel}
        </Text>
      </Pressable>

      <View className="flex-row items-center gap-3 shrink-0">
        {showHome ? (
          <Pressable
            onPress={navigateHome}
            accessibilityRole="button"
            accessibilityLabel="Retour à l'accueil"
            hitSlop={8}
          >
            <Text className={`text-sm font-medium ${textMuted(isDark)}`}>
              Accueil
            </Text>
          </Pressable>
        ) : null}
        <KofiDonateLink />
      </View>
    </View>
  );
}
