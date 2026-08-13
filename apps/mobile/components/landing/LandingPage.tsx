import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

/** Page marketing SEO — contenu entièrement rendu côté serveur / DOM initial. */
export function LandingPage() {
  const { t } = useTranslation("landing");
  const [scrollY, setScrollY] = useState(0);

  return (
    <View className="flex-1 bg-sand-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={Platform.OS === "web"}
        scrollEventThrottle={16}
        onScroll={(event) => {
          setScrollY(event.nativeEvent.contentOffset.y);
        }}
      >
        <LandingHeader />

        <SemanticWeb tag="main">
          <LandingHero scrollY={scrollY} />
          <LandingBenefits />
          <LandingHowItWorks />
        </SemanticWeb>

        <SemanticWeb tag="section" className="bg-sand-100 border-t border-sand-200/60">
          <View className="max-w-3xl mx-auto px-6 py-10 items-center">
            <SemanticWeb
              tag="h2"
              className="font-display text-2xl text-sand-900 mb-3 text-center"
            >
              {t("ctaBand.title")}
            </SemanticWeb>
            <SemanticWeb
              tag="p"
              className="text-sand-600 text-base leading-7 mb-5 text-center"
            >
              {t("ctaBand.body")}
            </SemanticWeb>
            <View className="flex-row flex-wrap justify-center gap-3">
              <Link href={ROUTES.examples} asChild>
                <Pressable className="rounded-full border border-sage-400 bg-sand-50 px-5 py-2.5">
                  <Text className="text-sage-700 text-sm font-semibold">
                    {t("ctaBand.examples")}
                  </Text>
                </Pressable>
              </Link>
              <Link href={ROUTES.features} asChild>
                <Pressable className="rounded-full bg-sage-500 px-5 py-2.5">
                  <Text className="text-white text-sm font-semibold">
                    {t("ctaBand.features")}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </SemanticWeb>

        <LandingFooter />
      </ScrollView>
    </View>
  );
}
