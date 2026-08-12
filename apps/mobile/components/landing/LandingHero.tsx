import {
  ImageBackground,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

const HERO_IMAGE = require("@/assets/brand/pastek-home-hero.png");

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 12px 32px -12px rgba(248, 122, 122, 0.5)" } as const)
    : undefined;

const TAGS = [
  { label: "Lâcher-prise", bg: "bg-clay-400", text: "text-sand-900" },
  { label: "Focus créatif", bg: "bg-sage-500", text: "text-white" },
  { label: "Expression", bg: "bg-melon-500", text: "text-white" },
] as const;

const heroMinHeight = Platform.OS === "web" ? 520 : 460;

export function LandingHero() {
  return (
    <SemanticWeb
      tag="section"
      className="border-b border-sand-200/80 overflow-hidden"
      aria-label="Présentation du générateur d'exercices créatifs Pastek Art"
    >
      <ImageBackground
        source={HERO_IMAGE}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
        imageStyle={
          Platform.OS === "web"
            ? ({ objectPosition: "center center" } as const)
            : undefined
        }
        style={{ width: "100%", minHeight: heroMinHeight }}
      >
        <View className="absolute inset-0 bg-sand-50/50" />

        <View className="relative max-w-3xl mx-auto px-6 pt-10 pb-14 md:pt-12 md:pb-20 items-center">
          <View className="flex-row flex-wrap justify-center gap-2 mb-6">
            {TAGS.map((tag) => (
              <View
                key={tag.label}
                className={`rounded-full px-3 py-1.5 ${tag.bg}`}
              >
                <Text className={`text-xs font-semibold tracking-wide ${tag.text}`}>
                  {tag.label}
                </Text>
              </View>
            ))}
          </View>

          <View className="landing-hero-copy-wrap mb-8 px-1">
            <SemanticWeb
              tag="h1"
              className="landing-hero-copy font-display text-3xl md:text-4xl lg:text-[2.65rem] leading-snug text-white text-center whitespace-pre-line bg-sage-600 px-2 py-1"
            >
              {`Libérez Votre Créativité,\nUn Exercice à la Fois`}
            </SemanticWeb>

            <SemanticWeb
              tag="p"
              className="landing-hero-copy text-base md:text-lg leading-8 text-white text-center bg-sage-600 px-2 py-1"
            >
              Pastek Art vous invite à explorer le dessin, la peinture et le collage comme un
              jeu bienveillant — consignes guidées, miroir créatif, et rien de clinique. Votre
              clé IA reste chez vous (BYOK) ; vos traces restent locales.
            </SemanticWeb>
          </View>

          <View className="flex-row flex-wrap items-center justify-center gap-3 mb-8">
            <View className="rounded-full bg-mint-100/95 px-3 py-1.5 border border-sage-200">
              <Text className="text-sage-800 text-xs font-semibold">
                100 % local & privé
              </Text>
            </View>
            <View className="rounded-full bg-melon-50/95 px-3 py-1.5 border border-melon-200">
              <Text className="text-melon-700 text-xs font-semibold">BYOK activé</Text>
            </View>
          </View>

          <Link href={ROUTES.home} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Commencer à créer"
              className="rounded-full bg-melon-500 active:bg-melon-600 px-9 py-4 min-h-[52px] justify-center web:transition-colors web:duration-200 web:hover:bg-melon-600"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide text-center">
                Commencer à créer
              </Text>
            </Pressable>
          </Link>
        </View>
      </ImageBackground>
    </SemanticWeb>
  );
}
