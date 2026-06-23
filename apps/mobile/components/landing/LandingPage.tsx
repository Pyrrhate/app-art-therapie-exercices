import { Platform, ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

/** Page marketing SEO — contenu entièrement rendu côté serveur / DOM initial. */
export function LandingPage() {
  return (
    <View className="flex-1 bg-sand-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={Platform.OS === "web"}
      >
        <SemanticWeb tag="header" className="border-b border-sand-200/60 bg-sand-50/95">
          <View className="max-w-5xl mx-auto px-6 py-4 flex-row items-center gap-3">
            <Link href={ROUTES.home} accessibilityLabel="Accéder à l'application">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-full bg-sage-500 items-center justify-center"
                  accessibilityLabel="Logo Pastek Art"
                >
                  <SemanticWeb tag="p" className="text-white font-display text-lg leading-none">
                    p
                  </SemanticWeb>
                </View>
                <SemanticWeb tag="p" className="font-display text-lg text-sand-900">
                  Pastek Art
                </SemanticWeb>
              </View>
            </Link>
          </View>
        </SemanticWeb>

        <SemanticWeb tag="main">
          <LandingHero />
          <LandingBenefits />
          <LandingHowItWorks />
        </SemanticWeb>

        <LandingFooter />
      </ScrollView>
    </View>
  );
}
