import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Link, router } from "expo-router";
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

const MOBILE_BREAKPOINT = 768;

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 10px 28px -10px rgba(248, 122, 122, 0.55)" } as const)
    : undefined;

function NavLink({
  item,
  isActive,
  onPress,
  large = false,
}: {
  item: LandingNavItem;
  isActive: boolean;
  onPress?: () => void;
  large?: boolean;
}) {
  const textClass = large
    ? "text-base font-semibold py-1"
    : "text-sm font-medium";

  if (isActive) {
    return (
      <Text className={`${textClass} text-sand-800`}>{item.label}</Text>
    );
  }

  return (
    <Link href={item.href} asChild>
      <Pressable
        hitSlop={8}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={item.label}
      >
        <Text className={`${textClass} text-sage-700`}>{item.label}</Text>
      </Pressable>
    </Link>
  );
}

export function LandingHeader({
  maxWidth = "5xl",
  navItems = DEFAULT_NAV,
  activeHref,
}: LandingHeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const [menuOpen, setMenuOpen] = useState(false);
  const maxW = maxWidth === "3xl" ? "max-w-3xl" : "max-w-5xl";

  function closeMenu() {
    setMenuOpen(false);
  }

  function goCreate() {
    closeMenu();
    router.push(ROUTES.home);
  }

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
              <SemanticWeb
                tag="p"
                className="font-display text-lg text-sand-900 leading-5"
              >
                Pastek Art
              </SemanticWeb>
              <Text className="text-sage-600 text-[11px] tracking-wide">
                pastek-art.eu
              </Text>
            </View>
          </View>
        </Link>

        {isMobile ? (
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le menu"
            accessibilityState={{ expanded: menuOpen }}
            hitSlop={10}
            className="w-11 h-11 rounded-2xl border border-sand-200 bg-sand-50 items-center justify-center active:bg-mint-100"
          >
            <View className="gap-1.5 w-5">
              <View className="h-0.5 rounded-full bg-sand-800" />
              <View className="h-0.5 rounded-full bg-sand-800" />
              <View className="h-0.5 rounded-full bg-melon-500" />
            </View>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-5 justify-end">
            {navItems.length > 0 ? (
              <SemanticWeb
                tag="nav"
                aria-label="Navigation principale"
                className="flex-row items-center gap-4"
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={activeHref === item.href}
                  />
                ))}
              </SemanticWeb>
            ) : null}

            <Pressable
              onPress={goCreate}
              accessibilityRole="button"
              accessibilityLabel="Commencer à créer"
              className="rounded-full bg-melon-500 active:bg-melon-600 px-4 py-2 min-h-[40px] justify-center web:hover:bg-melon-600"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                Commencer
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal
        visible={menuOpen}
        animationType="fade"
        transparent
        onRequestClose={closeMenu}
      >
        <View className="flex-1 justify-start">
          <Pressable
            className="absolute inset-0 bg-sand-900/40"
            onPress={closeMenu}
            accessibilityLabel="Fermer le menu"
          />
          <View
            className="bg-sand-50 border-b border-sand-200 px-6 pt-5 pb-8 rounded-b-3xl"
            style={
              Platform.OS === "web"
                ? ({ boxShadow: "0 16px 40px rgba(51, 51, 51, 0.12)" } as const)
                : undefined
            }
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-display text-xl text-sand-900">Menu</Text>
              <Pressable
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Fermer le menu"
                hitSlop={10}
                className="w-10 h-10 rounded-full bg-mint-100 items-center justify-center"
              >
                <Text className="text-sage-800 text-lg font-semibold">×</Text>
              </Pressable>
            </View>

            <SemanticWeb
              tag="nav"
              aria-label="Navigation mobile"
              className="gap-1"
            >
              {navItems.map((item) => (
                <View
                  key={item.href}
                  className="border-b border-sand-100 py-3"
                >
                  <NavLink
                    item={item}
                    isActive={activeHref === item.href}
                    large
                    onPress={closeMenu}
                  />
                </View>
              ))}
            </SemanticWeb>

            <Pressable
              onPress={goCreate}
              accessibilityRole="button"
              accessibilityLabel="Commencer à créer"
              className="mt-6 rounded-full bg-melon-500 active:bg-melon-600 px-5 py-3.5 min-h-[48px] items-center justify-center"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                Commencer à créer
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SemanticWeb>
  );
}
