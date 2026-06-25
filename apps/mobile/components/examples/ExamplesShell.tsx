import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

interface ExamplesShellProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; href: string }[];
}

export function ExamplesShell({ children, breadcrumb }: ExamplesShellProps) {
  return (
    <View className="flex-1 bg-sand-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={Platform.OS === "web"}
      >
        <SemanticWeb tag="header" className="border-b border-sand-200/60 bg-sand-50/95">
          <View className="max-w-3xl mx-auto px-6 py-4 flex-row items-center justify-between gap-4">
            <Link href={ROUTES.landing} accessibilityLabel="Retour à l'accueil Pastek Art">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-sage-500 items-center justify-center">
                  <Text className="text-white font-display text-lg leading-none">p</Text>
                </View>
                <Text className="font-display text-lg text-sand-900">Pastek Art</Text>
              </View>
            </Link>
            <Link href={ROUTES.examples} asChild>
              <Pressable hitSlop={8}>
                <Text className="text-sage-600 text-sm font-medium">Tous les exemples</Text>
              </Pressable>
            </Link>
          </View>
        </SemanticWeb>

        {breadcrumb && breadcrumb.length > 0 ? (
          <SemanticWeb tag="nav" aria-label="Fil d'Ariane" className="max-w-3xl mx-auto px-6 pt-6">
            <View className="flex-row flex-wrap items-center gap-2">
              {breadcrumb.map((item, i) => (
                <View key={item.href} className="flex-row items-center gap-2">
                  {i > 0 ? (
                    <Text className="text-sand-400 text-xs">/</Text>
                  ) : null}
                  <Link href={item.href} asChild>
                    <Pressable>
                      <Text
                        className={`text-xs ${
                          i === breadcrumb.length - 1
                            ? "text-sand-600 font-medium"
                            : "text-sage-600"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              ))}
            </View>
          </SemanticWeb>
        ) : null}

        <SemanticWeb tag="main">{children}</SemanticWeb>

        <LandingFooter />
      </ScrollView>
    </View>
  );
}
