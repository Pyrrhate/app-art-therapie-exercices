import { Image, Platform, Pressable, Text, View } from "react-native";
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
const PARALLAX_EXTRA = 80;

interface LandingHeroProps {
  /** Décalage vertical du conteneur scroll parent (ScrollView). */
  scrollY?: number;
}

export function LandingHero({ scrollY = 0 }: LandingHeroProps) {
  const parallaxY = Math.min(scrollY * 0.3, 72);

  return (
    <SemanticWeb
      tag="section"
      className="border-b border-sand-200/80 overflow-hidden relative"
      aria-label="Présentation du générateur d'exercices créatifs Pastek Art"
      style={{ minHeight: heroMinHeight }}
    >
      <View
        className="absolute inset-0 overflow-hidden"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Image
          source={HERO_IMAGE}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            top: -PARALLAX_EXTRA / 2,
            height: heroMinHeight + PARALLAX_EXTRA,
            transform: [{ translateY: parallaxY }],
          }}
        />
      </View>

      <View className="absolute inset-0 bg-sand-50/50" pointerEvents="none" />

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
            className="font-display text-3xl md:text-4xl lg:text-[2.65rem] leading-snug text-sand-900 text-center"
          >
            {Platform.OS === "web" ? (
              <>
                <span className="landing-hero-mark">Libérez Votre Créativité,</span>
                <br />
                <span className="landing-hero-mark">Un Exercice à la Fois</span>
              </>
            ) : (
              <>
                <Text className="bg-sage-500 text-white px-1 py-0.5">
                  Libérez Votre Créativité,{"\n"}Un Exercice à la Fois
                </Text>
              </>
            )}
          </SemanticWeb>

          <SemanticWeb
            tag="p"
            className="text-base md:text-lg leading-8 text-sand-900 text-center"
          >
            {Platform.OS === "web" ? (
              <span className="landing-hero-mark">
                Pastek Art vous invite à explorer le dessin, la peinture et le collage comme
                un jeu bienveillant — consignes guidées, miroir créatif, et rien de clinique.
                Votre clé IA reste chez vous (BYOK) ; vos traces restent locales.
              </span>
            ) : (
              <Text className="bg-sage-500 text-white px-1 py-0.5">
                Pastek Art vous invite à explorer le dessin, la peinture et le collage comme un
                jeu bienveillant — consignes guidées, miroir créatif, et rien de clinique. Votre
                clé IA reste chez vous (BYOK) ; vos traces restent locales.
              </Text>
            )}
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
    </SemanticWeb>
  );
}
