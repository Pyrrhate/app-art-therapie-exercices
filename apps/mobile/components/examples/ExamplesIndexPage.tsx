import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";
import type { PastekExample } from "@/lib/examples/types";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 10px 32px -14px rgba(73, 99, 73, 0.55)" } as const)
    : undefined;

interface ExamplesIndexPageProps {
  examples: PastekExample[];
}

export function ExamplesIndexPage({ examples }: ExamplesIndexPageProps) {
  return (
    <View className="max-w-3xl mx-auto px-6 py-12 pb-20">
      <SemanticWeb tag="h1" className="font-display text-3xl md:text-4xl text-sand-900 mb-4">
        Exemples d'exercices d'art-thérapie
      </SemanticWeb>
      <SemanticWeb tag="p" className="text-sand-700 text-base md:text-lg leading-8 mb-10">
        Parcourez des parcours réels du générateur Pastek Art : impulsion, consigne
        personnalisée, création et réflexion bienveillante. Idéal pour comprendre l'outil
        avant de se lancer — ou pour s'inspirer en longue traîne (peinture, stress,
        lâcher-prise, couleurs douces…).
      </SemanticWeb>

      <View className="gap-4">
        {examples.map((ex) => (
          <Link key={ex.slug} href={ROUTES.example(ex.slug)} asChild>
            <Pressable className="bg-white rounded-2xl border border-sand-200 px-5 py-5 active:opacity-90">
              <Text className="text-sage-500 text-xs uppercase tracking-wider mb-2">
                {ex.technique} · {ex.durationMinutes} min
              </Text>
              <Text className="font-display text-xl text-sand-900 mb-2">{ex.title}</Text>
              <Text className="text-sand-600 text-sm leading-6">{ex.subtitle}</Text>
              <Text className="text-sage-600 text-sm font-medium mt-3">Lire l'exemple →</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Link href={ROUTES.home} asChild>
        <Pressable
          className="mt-10 self-start rounded-full bg-sage-500 px-8 py-4 min-h-[52px] justify-center"
          style={ctaShadow}
        >
          <Text className="text-white text-sm font-semibold">Essayer le générateur</Text>
        </Pressable>
      </Link>
    </View>
  );
}
