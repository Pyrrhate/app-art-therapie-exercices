import { Text, View } from "react-native";
import { SemanticWeb } from "@/components/landing/SemanticWeb";

const BENEFITS = [
  {
    title: "Réduction instantanée du stress",
    body: "Focaliser son attention sur les lignes, les formes et les couleurs apaise le système nerveux.",
    icon: "◎",
    iconLabel: "Symbole de calme",
  },
  {
    title: "Dépassement du blocage créatif",
    body: "Des consignes simples et intuitives permettent de briser la peur de la page blanche.",
    icon: "✦",
    iconLabel: "Symbole d'éveil créatif",
  },
  {
    title: "Exploration émotionnelle",
    body: "Laisser l'inconscient guider le geste pour libérer les tensions accumulées.",
    icon: "◌",
    iconLabel: "Symbole d'exploration intérieure",
  },
] as const;

export function LandingBenefits() {
  return (
    <SemanticWeb
      tag="section"
      className="bg-white"
      aria-label="Bénéfices de l'art-thérapie au quotidien"
    >
      <View className="max-w-5xl mx-auto px-6 py-14 md:py-16">
        <SemanticWeb
          tag="h2"
          className="font-display text-2xl md:text-3xl text-sand-900 mb-4"
        >
          Pourquoi intégrer un rituel créatif dans votre quotidien ?
        </SemanticWeb>

        <SemanticWeb tag="p" className="text-sand-700 text-base leading-7 mb-10 max-w-3xl">
          L'art-thérapie n'exige aucune compétence technique ni talent particulier. Le but
          n'est pas de créer une œuvre esthétique, mais de vivre pleinement le processus de
          création. En pratiquant régulièrement des exercices d'expression artistique, vous
          agissez directement sur votre bien-être :
        </SemanticWeb>

        <View className="flex-row flex-wrap gap-4 md:gap-6">
          {BENEFITS.map((item) => (
            <SemanticWeb
              key={item.title}
              tag="article"
              className="flex-1 min-w-[260px] basis-[280px] rounded-2xl border border-sand-200 bg-sand-50/80 p-6"
            >
              <Text
                accessibilityLabel={item.iconLabel}
                className="text-sage-500 text-2xl mb-3"
                aria-hidden={false}
              >
                {item.icon}
              </Text>
              <SemanticWeb tag="h3" className="text-sand-900 font-semibold text-base mb-2">
                {item.title}
              </SemanticWeb>
              <SemanticWeb tag="p" className="text-sand-600 text-sm leading-6">
                {item.body}
              </SemanticWeb>
            </SemanticWeb>
          ))}
        </View>
      </View>
    </SemanticWeb>
  );
}
