import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { PastekLogoIcon } from "@/components/brand/PastekBrandImage";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { DonateRow } from "@/components/ui/DonateRow";
import { navigateSiteHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AppHeaderProps {
  compact?: boolean;
  onNavigateTraces?: () => void;
}

/** Sous cette largeur, le libellé « Pastek Art » cède la place au menu. */
const BRAND_TEXT_MIN_WIDTH = 720;

function MenuDot({ isDark }: { isDark: boolean }) {
  return (
    <Text className={`text-xs px-0.5 ${textMuted(isDark)}`} accessibilityElementsHidden>
      ·
    </Text>
  );
}

export function AppHeader({ compact = false, onNavigateTraces }: AppHeaderProps) {
  const isDark = useIsDark();
  const { t } = useTranslation(["app", "common"]);
  const { width } = useWindowDimensions();
  const showBrandName = width >= BRAND_TEXT_MIN_WIDTH;

  return (
    <View className={compact ? "mb-4" : "mb-10"}>
      <DonateRow />
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={navigateSiteHome}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            showBrandName ? t("app:header.backHome") : t("common:brand.name")
          }
          className={`flex-row items-center shrink min-w-0 ${showBrandName ? "gap-2.5" : ""}`}
        >
          <PastekLogoIcon size={36} />
          {showBrandName ? (
            <Text className={`font-display text-lg ${textPrimary(isDark)}`} numberOfLines={1}>
              {t("common:brand.name")}
            </Text>
          ) : null}
        </Pressable>

        <View className="flex-row items-center shrink-0">
          <Pressable
            onPress={onNavigateTraces ?? (() => router.push(ROUTES.fil))}
            hitSlop={8}
          >
            <Text className={`text-sm ${textMuted(isDark)}`}>
              {t("app:header.fil")}
            </Text>
          </Pressable>
          <MenuDot isDark={isDark} />
          <Pressable onPress={() => router.push(ROUTES.settings)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>
              {t("app:header.settings")}
            </Text>
          </Pressable>
          <View className="ml-2">
            <LanguageToggle />
          </View>
        </View>
      </View>
    </View>
  );
}
