import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DonateRow } from "@/components/ui/DonateRow";
import { navigateBackOrHome, navigateHome } from "@/lib/navigation";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface ScreenNavBarProps {
  /** Libellé du lien retour (défaut traduit : « ← Retour » / « ← Back ») */
  backLabel?: string;
  /** Action retour personnalisée */
  onBack?: () => void;
  /** Afficher le lien Accueil à droite (défaut : oui) */
  showHome?: boolean;
  /** Nœud affiché à droite, avant le lien Accueil */
  rightAction?: ReactNode;
}

export function ScreenNavBar({
  backLabel,
  onBack = navigateBackOrHome,
  showHome = true,
  rightAction,
}: ScreenNavBarProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const resolvedBack = backLabel ?? t("nav.back");

  return (
    <View className="mb-4">
      <DonateRow />
      <View className="flex-row justify-between items-center gap-2">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={resolvedBack}
          hitSlop={8}
          className="shrink min-w-0"
        >
          <Text className="text-sage-500 text-sm" numberOfLines={1}>
            {resolvedBack}
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-3 shrink-0">
          {rightAction ?? null}
          {showHome ? (
            <Pressable
              onPress={navigateHome}
              accessibilityRole="button"
              accessibilityLabel={t("header.backHome")}
              hitSlop={8}
            >
              <Text className={`text-sm font-medium ${textMuted(isDark)}`}>
                {t("nav.home")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
