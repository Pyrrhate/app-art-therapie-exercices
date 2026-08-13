import { Platform, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SemanticWeb } from "@/components/landing/SemanticWeb";

const cardShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 8px 28px rgba(120, 165, 141, 0.12)" } as const)
    : undefined;

export function LandingBenefits() {
  const { t } = useTranslation("landing");

  const items = [
    {
      key: "1",
      title: t("benefits.item1Title"),
      body: t("benefits.item1Body"),
      pill: t("benefits.item1Pill"),
      pillBg: "bg-clay-400",
      pillText: "text-sand-900",
    },
    {
      key: "2",
      title: t("benefits.item2Title"),
      body: t("benefits.item2Body"),
      pill: t("benefits.item2Pill"),
      pillBg: "bg-sage-500",
      pillText: "text-white",
    },
    {
      key: "3",
      title: t("benefits.item3Title"),
      body: t("benefits.item3Body"),
      pill: t("benefits.item3Pill"),
      pillBg: "bg-melon-500",
      pillText: "text-white",
    },
  ] as const;

  return (
    <SemanticWeb
      tag="section"
      className="bg-mint-50"
      aria-label={t("benefits.aria")}
    >
      <View className="max-w-3xl mx-auto px-6 py-14 md:py-16">
        <SemanticWeb
          tag="h2"
          className="font-display text-2xl md:text-3xl text-sand-900 mb-4 text-center"
        >
          {t("benefits.title")}
        </SemanticWeb>

        <SemanticWeb
          tag="p"
          className="text-sand-700 text-base leading-7 mb-10 max-w-3xl mx-auto text-center"
        >
          {t("benefits.intro")}
        </SemanticWeb>

        <View className="flex-row flex-wrap gap-4 md:gap-6">
          {items.map((item) => (
            <View
              key={item.key}
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
