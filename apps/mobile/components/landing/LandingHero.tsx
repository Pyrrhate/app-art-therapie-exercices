import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { PastekMascot } from "@/components/brand/PastekBrandImage";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 10px 32px -14px rgba(73, 99, 73, 0.55)" } as const)
    : undefined;

export function LandingHero() {
  return (
    <SemanticWeb
      tag="section"
      className="bg-sand-50 border-b border-sand-200/80"
      aria-label="Présentation du générateur d'exercices créatifs"
    >
      <View className="max-w-3xl mx-auto px-6 pt-6 pb-14 md:pt-8 md:pb-20">
        <View className="items-center mb-8 md:mb-10">
          <PastekMascot size={Platform.OS === "web" ? 220 : 180} />
        </View>

        <SemanticWeb
          tag="h1"
          className="font-display text-3xl md:text-4xl lg:text-[2.6rem] leading-tight text-sand-900 mb-6"
        >
          Libérez votre geste : générateur d'exercices créatifs en ligne
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base md:text-lg leading-8 mb-10 max-w-2xl"
        >
          Parfois, poser des mots sur ce que l'on ressent est difficile. Le dessin, la
          peinture et le collage offrent un autre chemin pour explorer, jouer et
          exprimer. Que vous cherchiez à décompresser, à dépasser un blocage créatif, ou
          simplement un rituel quotidien pour vous recentrer, Pastek Art vous guide pas à
          pas — sans prétendre remplacer un accompagnement professionnel.
        </SemanticWeb>

        <Link href={ROUTES.home} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lancer le générateur d'exercices créatifs"
            className="self-start rounded-full bg-sage-500 active:bg-sage-600 px-8 py-4 min-h-[52px] justify-center web:transition-colors web:duration-200 web:hover:bg-sage-600"
            style={ctaShadow}
          >
            <Text className="text-white text-sm font-semibold tracking-wide text-center">
              Lancer le générateur d'exercices
            </Text>
          </Pressable>
        </Link>
      </View>
    </SemanticWeb>
  );
}
