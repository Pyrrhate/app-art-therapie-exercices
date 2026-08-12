import { Text, View } from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <SemanticWeb tag="footer" className="bg-sand-100 border-t border-sand-200">
      <View className="max-w-3xl mx-auto px-6 py-8 gap-4">
        <View className="flex-row flex-wrap justify-center gap-4">
          <Link href={ROUTES.examples}>
            <Text className="text-sage-700 text-sm font-medium">Exercices</Text>
          </Link>
          <Link href={ROUTES.home}>
            <Text className="text-sage-700 text-sm font-medium">Espace créatif</Text>
          </Link>
          <Link href={ROUTES.aiEngines}>
            <Text className="text-sage-700 text-sm font-medium">Config IA</Text>
          </Link>
          <Link href={ROUTES.changelog}>
            <Text className="text-sage-700 text-sm font-medium">Mises à jour</Text>
          </Link>
          <Link href={ROUTES.privacy}>
            <Text className="text-sage-700 text-sm font-medium">À propos</Text>
          </Link>
        </View>
        <Text className="text-sand-500 text-sm text-center leading-6">
          Pastek Art · pastek-art.eu — générateur d&apos;exercices créatifs. © {year}
        </Text>
      </View>
    </SemanticWeb>
  );
}
