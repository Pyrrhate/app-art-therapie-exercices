import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import {
  FEATURES_HERO,
  FEATURES_SECTIONS,
} from "@/lib/features/copy";
import { ROUTES } from "@/lib/routes";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 12px 32px -12px rgba(248, 122, 122, 0.45)" } as const)
    : undefined;

export function FeaturesPage() {
  return (
    <SemanticWeb tag="article" className="bg-sand-50" aria-label="Fonctionnalités">
      <View className="max-w-2xl mx-auto px-6 pt-10 pb-6">
        <SemanticWeb
          tag="p"
          className="text-sage-600 text-xs uppercase tracking-[0.18em] font-medium mb-3"
        >
          {FEATURES_HERO.kicker}
        </SemanticWeb>
        <SemanticWeb
          tag="h1"
          className="font-display text-3xl md:text-4xl text-sand-900 leading-tight mb-6"
        >
          {FEATURES_HERO.title}{" "}
          <Text className="text-sage-700">{FEATURES_HERO.accent}</Text>
        </SemanticWeb>
        <SemanticWeb
          tag="p"
          className="text-sand-700 text-lg leading-8"
        >
          {FEATURES_HERO.lead}
        </SemanticWeb>
      </View>

      {FEATURES_SECTIONS.map((section) => (
        <SemanticWeb
          key={section.id}
          tag="section"
          className="max-w-2xl mx-auto px-6 py-8 border-t border-sand-200/80"
          aria-label={section.title}
        >
          <SemanticWeb
            tag="p"
            className="text-sage-600 text-[11px] uppercase tracking-[0.18em] font-medium mb-2"
          >
            {section.kicker}
          </SemanticWeb>
          <SemanticWeb
            tag="h2"
            className="font-display text-2xl text-sand-900 mb-4 leading-snug"
          >
            {section.title}
          </SemanticWeb>
          {section.paragraphs.map((p) => (
            <SemanticWeb
              key={p.slice(0, 48)}
              tag="p"
              className="text-sand-700 text-base leading-8 mb-4"
            >
              {p}
            </SemanticWeb>
          ))}
        </SemanticWeb>
      ))}

      <View className="max-w-2xl mx-auto px-6 pt-4 pb-14 items-center">
        <Link href={ROUTES.home} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'espace créatif"
            className="rounded-full bg-melon-500 active:bg-melon-600 px-8 py-3.5 min-h-[48px] justify-center web:hover:bg-melon-600"
            style={ctaShadow}
          >
            <Text className="text-white text-sm font-semibold tracking-wide">
              Entrer dans l&apos;atelier
            </Text>
          </Pressable>
        </Link>
      </View>
    </SemanticWeb>
  );
}
