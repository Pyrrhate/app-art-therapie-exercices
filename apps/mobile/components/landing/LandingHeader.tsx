import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

type LandingNavItem = {
  label: string;
  href: string;
};

const DEFAULT_NAV: LandingNavItem[] = [{ label: "Exemples", href: ROUTES.examples }];

interface LandingHeaderProps {
  maxWidth?: "3xl" | "5xl";
  navItems?: LandingNavItem[];
  activeHref?: string;
}

export function LandingHeader({
  maxWidth = "5xl",
  navItems = DEFAULT_NAV,
  activeHref,
}: LandingHeaderProps) {
  const maxW = maxWidth === "3xl" ? "max-w-3xl" : "max-w-5xl";

  return (
    <SemanticWeb tag="header" className="border-b border-sand-200/60 bg-sand-50/95">
      <View className={`${maxW} mx-auto px-6 py-4 flex-row items-center justify-between gap-4`}>
        <Link href={ROUTES.landing} accessibilityLabel="Retour à l'accueil Pastek Art">
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

        {navItems.length > 0 ? (
          <SemanticWeb
            tag="nav"
            aria-label="Navigation principale"
            className="flex-row items-center gap-4"
          >
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              if (isActive) {
                return (
                  <Text key={item.href} className="text-sand-600 text-sm font-medium">
                    {item.label}
                  </Text>
                );
              }
              return (
                <Link key={item.href} href={item.href} asChild>
                  <Pressable hitSlop={8}>
                    <Text className="text-sage-600 text-sm font-medium">{item.label}</Text>
                  </Pressable>
                </Link>
              );
            })}
          </SemanticWeb>
        ) : null}
      </View>
    </SemanticWeb>
  );
}
