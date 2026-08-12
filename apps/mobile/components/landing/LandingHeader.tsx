import { Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { PastekLogoIcon } from "@/components/brand/PastekBrandImage";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

type LandingNavItem = {
  label: string;
  href: string;
};

const DEFAULT_NAV: LandingNavItem[] = [
  { label: "Exercices", href: ROUTES.examples },
  { label: "Espace créatif", href: ROUTES.home },
  { label: "Config IA", href: ROUTES.aiEngines },
  { label: "À propos", href: ROUTES.privacy },
];

interface LandingHeaderProps {
  maxWidth?: "3xl" | "5xl";
  navItems?: LandingNavItem[];
  activeHref?: string;
}

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 10px 28px -10px rgba(248, 122, 122, 0.55)" } as const)
    : undefined;

export function LandingHeader({
  maxWidth = "5xl",
  navItems = DEFAULT_NAV,
  activeHref,
}: LandingHeaderProps) {
  const maxW = maxWidth === "3xl" ? "max-w-3xl" : "max-w-5xl";

  return (
    <SemanticWeb
      tag="header"
      className="border-b border-sand-200/70 bg-sand-50/95"
    >
      <View
        className={`${maxW} mx-auto px-6 py-4 flex-row items-center justify-between gap-4`}
      >
        <Link
          href={ROUTES.landing}
          accessibilityLabel="Retour à l'accueil pastek-art.eu"
        >
          <View className="flex-row items-center gap-3">
            <PastekLogoIcon size={36} accessibilityLabel="Logo Pastek Art" />
            <View>
              <SemanticWeb tag="p" className="font-display text-lg text-sand-900 leading-5">
                Pastek Art
              </SemanticWeb>
              <Text className="text-sage-600 text-[11px] tracking-wide">
                pastek-art.eu
              </Text>
            </View>
          </View>
        </Link>

        <View className="flex-row items-center gap-3 md:gap-5 flex-wrap justify-end">
          {navItems.length > 0 ? (
            <SemanticWeb
              tag="nav"
              aria-label="Navigation principale"
              className="flex-row items-center gap-3 md:gap-4"
            >
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                if (isActive) {
                  return (
                    <Text
                      key={item.href}
                      className="text-sand-800 text-sm font-semibold"
                    >
                      {item.label}
                    </Text>
                  );
                }
                return (
                  <Link key={item.href} href={item.href} asChild>
                    <Pressable hitSlop={8}>
                      <Text className="text-sage-700 text-sm font-medium">
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </SemanticWeb>
          ) : null}

          <Link href={ROUTES.home} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Commencer à créer"
              className="rounded-full bg-melon-500 active:bg-melon-600 px-4 py-2 min-h-[40px] justify-center web:hover:bg-melon-600"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                Commencer
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SemanticWeb>
  );
}
