import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { PastekMascot } from "@/components/brand/PastekBrandImage";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 12px 32px -12px rgba(248, 122, 122, 0.5)" } as const)
    : undefined;

const TAGS = [
  { label: "Lâcher-prise", bg: "bg-clay-400", text: "text-sand-900" },
  { label: "Focus créatif", bg: "bg-sage-500", text: "text-white" },
  { label: "Expression", bg: "bg-melon-500", text: "text-white" },
] as const;

export function LandingHero() {
  return (
    <SemanticWeb
      tag="section"
      className="bg-sand-50 border-b border-sand-200/80"
      aria-label="Présentation du générateur d'exercices créatifs Pastek Art"
    >
      <View className="max-w-3xl mx-auto px-6 pt-6 pb-14 md:pt-8 md:pb-20 items-center">
        <View className="items-center mb-6 md:mb-8">
          <PastekMascot size={Platform.OS === "web" ? 220 : 180} />
        </View>

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

        <SemanticWeb
          tag="h1"
          className="font-display text-3xl md:text-4xl lg:text-[2.65rem] leading-tight text-sand-900 mb-5 text-center"
        >
          Libérez Votre Créativité, Un Exercice à la Fois
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base md:text-lg leading-8 mb-8 max-w-2xl text-center"
        >
          Pastek Art vous invite à explorer le dessin, la peinture et le collage comme un
          jeu bienveillant — consignes guidées, miroir créatif, et rien de clinique. Votre
          clé IA reste chez vous (BYOK) ; vos traces restent locales.
        </SemanticWeb>

        <View className="flex-row flex-wrap items-center justify-center gap-3 mb-8">
          <View className="rounded-full bg-mint-100 px-3 py-1.5 border border-sage-200">
            <Text className="text-sage-800 text-xs font-semibold">
              100 % local & privé
            </Text>
          </View>
          <View className="rounded-full bg-melon-50 px-3 py-1.5 border border-melon-200">
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
