import { Text, View } from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <SemanticWeb tag="footer" className="bg-sand-100 border-t border-sand-200">
      <View className="max-w-5xl mx-auto px-6 py-8 gap-3">
        <View className="flex-row flex-wrap justify-center gap-4">
          <Link href={ROUTES.examples}>
            <Text className="text-sage-600 text-sm">Exemples</Text>
          </Link>
          <Link href={ROUTES.changelog}>
            <Text className="text-sage-600 text-sm">Mises à jour</Text>
          </Link>
          <Link href={ROUTES.home}>
            <Text className="text-sage-600 text-sm">Application</Text>
          </Link>
        </View>
        <Text className="text-sand-500 text-sm text-center leading-6">
          Générateur d&apos;exercices d&apos;art-thérapie — rituels créatifs pour le
          bien-être. © {year}
        </Text>
      </View>
    </SemanticWeb>
  );
}
