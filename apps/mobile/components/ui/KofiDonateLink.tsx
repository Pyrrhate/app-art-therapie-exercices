import { Platform, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { openSupportUrl } from "@/lib/support";
import { useIsDark } from "@/lib/themeStore";

/** Lien Ko-fi inline (dans le flux de la barre de navigation). */
export function KofiDonateLink() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");

  return (
    <Pressable
      onPress={() => void openSupportUrl()}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityLabel={t("settings.donateA11y")}
      className={`self-end shrink-0 rounded-full px-3 py-1.5 border ${
        isDark ? "border-sand-600 bg-sand-900/90" : "border-sand-200 bg-white/95"
      }`}
      style={[
        { alignSelf: "flex-end" },
        Platform.OS === "web"
          ? ({ backdropFilter: "blur(8px)" } as const)
          : null,
      ]}
    >
      <Text className="text-sage-500 text-sm font-medium">Donate</Text>
    </Pressable>
  );
}
