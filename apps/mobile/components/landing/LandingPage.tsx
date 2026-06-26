import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
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
        <LandingHeader />

        <SemanticWeb tag="main">
          <LandingHero />
          <LandingBenefits />
          <LandingHowItWorks />
        </SemanticWeb>

        <SemanticWeb tag="section" className="bg-sand-50 border-t border-sand-200/60">
          <View className="max-w-3xl mx-auto px-6 py-10">
            <SemanticWeb tag="h2" className="font-display text-2xl text-sand-900 mb-3">
              Voir un exemple de parcours
            </SemanticWeb>
            <SemanticWeb tag="p" className="text-sand-600 text-base leading-7 mb-5">
              Impulsion, consigne IA, création et réflexion — découvrez à quoi ressemble un
              rituel complet avant de vous lancer.
            </SemanticWeb>
            <Link href={ROUTES.examples} asChild>
              <Pressable className="self-start">
                <Text className="text-sage-600 text-sm font-semibold">
                  Parcourir les exemples →
                </Text>
              </Pressable>
            </Link>
          </View>
        </SemanticWeb>

        <LandingFooter />
      </ScrollView>
    </View>
  );
}
