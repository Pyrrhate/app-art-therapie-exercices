import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

export function LandingHowItWorks() {
  return (
    <SemanticWeb
      tag="section"
      className="bg-sand-50 border-t border-sand-200/80"
      aria-label="Fonctionnement du générateur"
    >
      <View className="max-w-3xl mx-auto px-6 py-14 md:py-16">
        <SemanticWeb tag="h2" className="font-display text-2xl md:text-3xl text-sand-900 mb-6">
          Comment fonctionne notre générateur d'exercices ?
        </SemanticWeb>

        <SemanticWeb tag="p" className="text-sand-700 text-base leading-7 mb-5">
          Vous n'avez pas besoin de matériel complexe. Munissez-vous simplement d'un carnet,
          d'un stylo, de feutres, de pastels ou de quelques feuilles de récupération
          (recycl'art), puis lancez le générateur.
        </SemanticWeb>

        <SemanticWeb tag="p" className="text-sand-700 text-base leading-7 mb-10">
          Chaque clic vous propose une consigne précise, un univers coloré ou un thème
          graphique adapté à votre état d'esprit du moment. Laissez-vous porter par la
          suggestion, ajustez l'intensité visuelle si nécessaire, et accordez-vous ce moment
          de déconnexion totale.
        </SemanticWeb>

        <Link href={ROUTES.home} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Accéder au générateur d'exercices d'art-thérapie"
            className="self-start rounded-full border border-sage-400 bg-white px-7 py-3.5 min-h-[48px] justify-center web:transition-colors web:duration-200 web:hover:bg-sage-50"
          >
            <Text className="text-sage-600 text-sm font-semibold tracking-wide">
              Lancer le générateur d'exercices
            </Text>
          </Pressable>
        </Link>
      </View>
    </SemanticWeb>
  );
}
