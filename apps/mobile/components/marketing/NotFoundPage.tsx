import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 10px 32px -14px rgba(73, 99, 73, 0.55)" } as const)
    : undefined;

export function NotFoundPage() {
  const { t } = useTranslation("legal");

  return (
    <View className="flex-1 bg-sand-50">
      <View className="flex-1">
        <LandingHeader />

        <SemanticWeb
          tag="main"
          className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24"
          aria-label={t("notFound.aria")}
        >
          <Text className="text-sage-500 text-xs uppercase tracking-[0.2em] mb-4 font-medium">
            {t("notFound.code")}
          </Text>
          <SemanticWeb
            tag="h1"
            className="font-display text-3xl md:text-4xl text-sand-900 mb-5 leading-tight"
          >
            {t("notFound.title")}
          </SemanticWeb>
          <SemanticWeb tag="p" className="text-sand-600 text-base md:text-lg leading-8 mb-10 max-w-xl">
            {t("notFound.body")}
          </SemanticWeb>

          <Link href={ROUTES.home} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("notFound.ctaLabel")}
              className="self-start rounded-full bg-sage-500 active:bg-sage-600 px-8 py-4 min-h-[52px] justify-center web:transition-colors web:duration-200 web:hover:bg-sage-600"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide text-center">
                {t("notFound.cta")}
              </Text>
            </Pressable>
          </Link>

          <View className="flex-row flex-wrap gap-x-6 gap-y-2 mt-8">
            <Link href={ROUTES.landing} asChild>
              <Pressable hitSlop={8}>
                <Text className="text-sage-600 text-sm font-medium">
                  {t("notFound.home")}
                </Text>
              </Pressable>
            </Link>
            <Link href={ROUTES.examples} asChild>
              <Pressable hitSlop={8}>
                <Text className="text-sage-600 text-sm font-medium">
                  {t("notFound.examples")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </SemanticWeb>

        <LandingFooter />
      </View>
    </View>
  );
}
