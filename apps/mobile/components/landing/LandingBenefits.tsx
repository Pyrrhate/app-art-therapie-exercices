import { Platform, Text, View } from "react-native";
import { SemanticWeb } from "@/components/landing/SemanticWeb";

const BENEFITS = [
  {
    title: "Un moment pour ralentir",
    body: "Focaliser son attention sur les lignes, les formes et les couleurs aide à poser le rythme et à se recentrer.",
    pill: "Lâcher-prise",
    pillBg: "bg-clay-400",
    pillText: "text-sand-900",
  },
  {
    title: "Dépassement du blocage créatif",
    body: "Des consignes simples et intuitives permettent de briser la peur de la page blanche.",
    pill: "Focus",
    pillBg: "bg-sage-500",
    pillText: "text-white",
  },
  {
    title: "Exploration personnelle",
    body: "Laisser le geste guider la découverte — curiosité, jeu et matière avant tout jugement.",
    pill: "Expression",
    pillBg: "bg-melon-500",
    pillText: "text-white",
  },
] as const;

const cardShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 8px 28px rgba(120, 165, 141, 0.12)" } as const)
    : undefined;

export function LandingBenefits() {
  return (
    <SemanticWeb
      tag="section"
      className="bg-mint-50"
      aria-label="Bénéfices d'un rituel créatif au quotidien"
    >
      <View className="max-w-5xl mx-auto px-6 py-14 md:py-16">
        <SemanticWeb
          tag="h2"
          className="font-display text-2xl md:text-3xl text-sand-900 mb-4 text-center"
        >
          Pourquoi intégrer un rituel créatif dans votre quotidien ?
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base leading-7 mb-10 max-w-3xl mx-auto text-center"
        >
          Un exercice créatif n&apos;exige aucune compétence technique ni talent
          particulier. Le but n&apos;est pas de créer une œuvre esthétique, mais de vivre
          pleinement le processus de création. En pratiquant régulièrement, vous cultivez
          curiosité, lâcher-prise et bien-être au quotidien :
        </SemanticWeb>

        <View className="flex-row flex-wrap gap-4 md:gap-6">
          {BENEFITS.map((item) => (
            <View
              key={item.title}
              className="flex-1 min-w-[260px] basis-[280px] rounded-2xl border border-sand-200/80 bg-sand-50 p-6"
              style={cardShadow}
            >
              <View className={`self-start rounded-full px-3 py-1 mb-4 ${item.pillBg}`}>
                <Text
                  className={`text-[11px] font-semibold tracking-wide ${item.pillText}`}
                >
                  {item.pill}
                </Text>
              </View>
              <SemanticWeb
                tag="h3"
                className="text-sand-900 font-semibold text-base mb-2"
              >
                {item.title}
              </SemanticWeb>
              <SemanticWeb tag="p" className="text-sand-600 text-sm leading-6">
                {item.body}
              </SemanticWeb>
            </View>
          ))}
        </View>
      </View>
    </SemanticWeb>
  );
}
