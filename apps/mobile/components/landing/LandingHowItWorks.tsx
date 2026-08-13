import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 12px 32px -12px rgba(248, 122, 122, 0.45)" } as const)
    : undefined;

export function LandingHowItWorks() {
  const { t } = useTranslation("landing");

  return (
    <SemanticWeb
      tag="section"
      className="bg-sand-50 border-t border-sand-200/80"
      aria-label={t("how.aria")}
    >
      <View className="max-w-3xl mx-auto px-6 py-14 md:py-16">
        <SemanticWeb
          tag="h2"
          className="font-display text-2xl md:text-3xl text-sand-900 mb-6 text-center"
        >
          {t("how.title")}
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base leading-7 mb-5 text-center"
        >
          {t("how.p1")}
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base leading-7 mb-8 text-center"
        >
          {t("how.p2")}
        </SemanticWeb>

        <View className="flex-row flex-wrap justify-center gap-2 mb-10">
          <View className="rounded-2xl bg-mint-100 border border-sage-200 px-4 py-3">
            <Text className="text-sage-800 text-xs font-semibold text-center">
              {t("how.badgeNoWall")}
            </Text>
          </View>
          <View className="rounded-2xl bg-clay-300/60 border border-clay-400 px-4 py-3">
            <Text className="text-sand-800 text-xs font-semibold text-center">
              {t("how.badgeLocal")}
            </Text>
          </View>
          <View className="rounded-2xl bg-melon-50 border border-melon-200 px-4 py-3">
            <Text className="text-melon-700 text-xs font-semibold text-center">
              {t("how.badgeDrive")}
            </Text>
          </View>
        </View>

        <View className="items-center">
          <Link href={ROUTES.home} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("how.cta")}
              className="rounded-full bg-melon-500 active:bg-melon-600 px-8 py-3.5 min-h-[48px] justify-center web:hover:bg-melon-600"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                {t("how.cta")}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SemanticWeb>
  );
}
