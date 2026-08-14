import { createElement } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { getGlossaryHero, getGlossaryTerms } from "@/lib/glossary/copy";
import { ROUTES } from "@/lib/routes";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 12px 32px -12px rgba(248, 122, 122, 0.45)" } as const)
    : undefined;

function GlossaryTocLink({ id, label }: { id: string; label: string }) {
  if (Platform.OS === "web") {
    return createElement(
      "a",
      {
        href: `#${id}`,
        className: "text-sage-700 text-sm font-medium hover:text-sage-900",
      },
      label
    );
  }
  return <Text className="text-sage-700 text-sm font-medium">{label}</Text>;
}

export function GlossaryPage() {
  const { t } = useTranslation("glossary");
  const hero = getGlossaryHero(t);
  const terms = getGlossaryTerms(t);

  return (
    <SemanticWeb tag="article" className="bg-sand-50" aria-label={t("aria.page")}>
      <View className="max-w-2xl mx-auto px-6 pt-10 pb-6">
        <SemanticWeb
          tag="p"
          className="text-sage-600 text-xs uppercase tracking-[0.18em] font-medium mb-3"
        >
          {hero.kicker}
        </SemanticWeb>
        <SemanticWeb
          tag="h1"
          className="font-display text-3xl md:text-4xl text-sand-900 leading-tight mb-6"
        >
          {hero.title}
          <Text className="text-sage-700">{hero.accent}</Text>
        </SemanticWeb>
        <SemanticWeb tag="p" className="text-sand-700 text-lg leading-8">
          {hero.lead}
        </SemanticWeb>
      </View>

      <SemanticWeb
        tag="nav"
        className="max-w-2xl mx-auto px-6 pb-8"
        aria-label={t("aria.toc")}
      >
        <SemanticWeb
          tag="p"
          className="text-sage-600 text-[11px] uppercase tracking-[0.18em] font-medium mb-3"
        >
          {t("tocTitle")}
        </SemanticWeb>
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          {terms.map((entry) => (
            <GlossaryTocLink key={entry.id} id={entry.id} label={entry.term} />
          ))}
        </View>
      </SemanticWeb>

      {terms.map((entry) => (
        <SemanticWeb
          key={entry.id}
          tag="section"
          id={entry.id}
          className="max-w-2xl mx-auto px-6 py-8 border-t border-sand-200/80"
          aria-label={entry.term}
        >
          <SemanticWeb
            tag="h2"
            className="font-display text-2xl text-sand-900 mb-4 leading-snug"
          >
            {entry.term}
          </SemanticWeb>
          <SemanticWeb tag="p" className="text-sand-700 text-base leading-8">
            {entry.body}
          </SemanticWeb>
        </SemanticWeb>
      ))}

      <View className="max-w-2xl mx-auto px-6 pt-4 pb-14 items-center">
        <Link href={ROUTES.home} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("cta.a11y")}
            className="rounded-full bg-melon-500 active:bg-melon-600 px-8 py-3.5 min-h-[48px] justify-center web:hover:bg-melon-600"
            style={ctaShadow}
          >
            <Text className="text-white text-sm font-semibold tracking-wide">
              {t("cta.label")}
            </Text>
          </Pressable>
        </Link>
      </View>
    </SemanticWeb>
  );
}
