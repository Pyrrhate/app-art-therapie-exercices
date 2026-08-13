import { Pressable, Text, View } from "react-native";
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

export function AppHeader({ compact = false, onNavigateTraces }: AppHeaderProps) {
  const isDark = useIsDark();
  const { t } = useTranslation(["app", "common"]);

  return (
    <View className={compact ? "mb-4" : "mb-10"}>
      <DonateRow />
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={navigateSiteHome}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("app:header.backHome")}
          className="flex-row items-center gap-2.5 shrink min-w-0"
        >
          <PastekLogoIcon size={36} />
          <Text className={`font-display text-lg ${textPrimary(isDark)}`} numberOfLines={1}>
            {t("common:brand.name")}
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-3 shrink-0">
          <LanguageToggle />
          <Pressable
            onPress={onNavigateTraces ?? (() => router.push(ROUTES.fil))}
            hitSlop={8}
          >
            <Text className={`text-sm ${textMuted(isDark)}`}>
              {t("app:header.fil")}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.settings)} hitSlop={8}>
            <Text className={`text-sm ${textMuted(isDark)}`}>
              {t("app:header.settings")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
