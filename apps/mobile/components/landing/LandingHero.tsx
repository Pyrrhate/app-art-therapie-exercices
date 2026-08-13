import { Image, Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

const HERO_IMAGE = require("@/assets/brand/pastek-home-hero.png");

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 12px 32px -12px rgba(248, 122, 122, 0.5)" } as const)
    : undefined;

const TAG_STYLES = [
  { key: "tagLetGo" as const, bg: "bg-clay-400", text: "text-sand-900" },
  { key: "tagFocus" as const, bg: "bg-sage-500", text: "text-white" },
  { key: "tagExpression" as const, bg: "bg-melon-500", text: "text-white" },
];

const heroMinHeight = Platform.OS === "web" ? 520 : 460;
const PARALLAX_EXTRA = 80;

interface LandingHeroProps {
  /** Décalage vertical du conteneur scroll parent (ScrollView). */
  scrollY?: number;
}

export function LandingHero({ scrollY = 0 }: LandingHeroProps) {
  const { t } = useTranslation("landing");
  const parallaxY = Math.min(scrollY * 0.3, 72);

  return (
    <SemanticWeb
      tag="section"
      className="border-b border-sand-200/80 overflow-hidden relative"
      aria-label={t("hero.aria")}
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
          {TAG_STYLES.map((tag) => (
            <View
              key={tag.key}
              className={`rounded-full px-3 py-1.5 ${tag.bg}`}
            >
              <Text className={`text-xs font-semibold tracking-wide ${tag.text}`}>
                {t(`hero.${tag.key}`)}
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
                <span className="landing-hero-mark">{t("hero.titleLine1")}</span>
                <br />
                <span className="landing-hero-mark">{t("hero.titleLine2")}</span>
              </>
            ) : (
              <Text className="bg-sage-500 text-white px-1 py-0.5">
                {t("hero.titleLine1")}
                {"\n"}
                {t("hero.titleLine2")}
              </Text>
            )}
          </SemanticWeb>

          <SemanticWeb
            tag="p"
            className="text-base md:text-lg leading-8 text-sand-900 text-center"
          >
            {Platform.OS === "web" ? (
              <span className="landing-hero-mark">{t("hero.lead")}</span>
            ) : (
              <Text className="bg-sage-500 text-white px-1 py-0.5">
                {t("hero.lead")}
              </Text>
            )}
          </SemanticWeb>
        </View>

        <View className="flex-row flex-wrap items-center justify-center gap-3 mb-8">
          <View className="rounded-full bg-mint-100/95 px-3 py-1.5 border border-sage-200">
            <Text className="text-sage-800 text-xs font-semibold">
              {t("hero.badgeLocal")}
            </Text>
          </View>
          <View className="rounded-full bg-melon-50/95 px-3 py-1.5 border border-melon-200">
            <Text className="text-melon-700 text-xs font-semibold">
              {t("hero.badgeByok")}
            </Text>
          </View>
        </View>

        <Link href={ROUTES.home} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("hero.cta")}
            className="rounded-full bg-melon-500 active:bg-melon-600 px-9 py-4 min-h-[52px] justify-center web:transition-colors web:duration-200 web:hover:bg-melon-600"
            style={ctaShadow}
          >
            <Text className="text-white text-sm font-semibold tracking-wide text-center">
              {t("hero.cta")}
            </Text>
          </Pressable>
        </Link>
      </View>
    </SemanticWeb>
  );
}
