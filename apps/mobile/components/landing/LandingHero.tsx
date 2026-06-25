import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
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
      aria-label="Présentation du générateur d'art-thérapie"
    >
      <View className="max-w-3xl mx-auto px-6 py-14 md:py-20">
        <SemanticWeb
          tag="h1"
          className="font-display text-3xl md:text-4xl lg:text-[2.6rem] leading-tight text-sand-900 mb-6"
        >
          Libérez votre esprit par le geste : Générateur d'exercices d'art-thérapie en
          ligne
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base md:text-lg leading-8 mb-10 max-w-2xl"
        >
          Parfois, poser des mots sur des émotions est difficile. Le dessin, la peinture et
          le collage permettent de contourner ce blocage pour exprimer visuellement ce qui
          se joue en nous. Que vous traversiez une période de stress, un blocage créatif,
          ou que vous cherchiez simplement un rituel quotidien pour vous recentrer, notre
          outil interactif vous guide pas à pas.
        </SemanticWeb>

        <Link href={ROUTES.home} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lancer le générateur d'exercices d'art-thérapie"
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
