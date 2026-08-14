import { Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

export function LandingFooter() {
  const { t } = useTranslation("landing");
  const year = new Date().getFullYear();

  return (
    <SemanticWeb tag="footer" className="bg-sand-100 border-t border-sand-200">
      <View className="max-w-3xl mx-auto px-6 py-8 gap-4">
        <View className="flex-row flex-wrap justify-center gap-4">
          <Link href={ROUTES.examples}>
            <Text className="text-sage-700 text-sm font-medium">
              {t("nav.examples")}
            </Text>
          </Link>
          <Link href={ROUTES.features}>
            <Text className="text-sage-700 text-sm font-medium">
              {t("nav.features")}
            </Text>
          </Link>
          <Link href={ROUTES.glossary}>
            <Text className="text-sage-700 text-sm font-medium">
              {t("nav.glossary")}
            </Text>
          </Link>
          <Link href={ROUTES.home}>
            <Text className="text-sage-700 text-sm font-medium">
              {t("nav.studio")}
            </Text>
          </Link>
          <Link href={ROUTES.aiEngines}>
            <Text className="text-sage-700 text-sm font-medium">
              {t("nav.aiConfig")}
            </Text>
          </Link>
          <Link href={ROUTES.changelog}>
            <Text className="text-sage-700 text-sm font-medium">
              {t("nav.updates")}
            </Text>
          </Link>
        </View>
        <Text className="text-sand-500 text-sm text-center leading-6">
          {t("footer.tagline", { year })}
        </Text>
      </View>
    </SemanticWeb>
  );
}
