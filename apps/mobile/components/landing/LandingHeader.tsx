import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { PastekLogoIcon } from "@/components/brand/PastekBrandImage";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";

type LandingNavItem = {
  label: string;
  href: string;
};

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
  itemClassName = "",
}: {
  item: LandingNavItem;
  isActive: boolean;
  onPress?: () => void;
  large?: boolean;
  itemClassName?: string;
}) {
  const textClass = large ? "text-base font-semibold py-1" : "text-sm font-medium";
  const activeClass = isActive
    ? "text-sand-900 border-b-2 border-sage-500 pb-0.5"
    : "text-sand-800 border-b-2 border-transparent pb-0.5 web:hover:border-sage-500";

  return (
    <View className={itemClassName}>
      <Link href={item.href} asChild>
        <Pressable
          hitSlop={8}
          onPress={onPress}
          accessibilityRole="link"
          accessibilityLabel={item.label}
        >
          <Text className={`${textClass} ${activeClass}`}>{item.label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function CreateButton({
  label,
  onPress,
  className = "",
}: {
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`rounded-full bg-melon-500 active:bg-melon-600 px-4 py-2 min-h-[40px] justify-center shrink-0 web:hover:bg-melon-600 ${className}`}
      style={ctaShadow}
    >
      <Text className="text-white text-sm font-semibold tracking-wide">{label}</Text>
    </Pressable>
  );
}

export function LandingHeader({
  maxWidth = "3xl",
  navItems,
  activeHref,
}: LandingHeaderProps) {
  const { t } = useTranslation(["landing", "common"]);
  const { width } = useWindowDimensions();
  const isNativeMobile = Platform.OS !== "web" && width < MOBILE_BREAKPOINT;
  const [menuOpen, setMenuOpen] = useState(false);
  const maxW = maxWidth === "3xl" ? "max-w-3xl" : "max-w-3xl";

  const defaultNav = useMemo<LandingNavItem[]>(
    () => [
      { label: t("landing:nav.examples"), href: ROUTES.examples },
      { label: t("landing:nav.features"), href: ROUTES.features },
      { label: t("landing:nav.studio"), href: ROUTES.home },
      { label: t("landing:nav.aiConfig"), href: ROUTES.aiEngines },
      { label: t("landing:nav.about"), href: ROUTES.privacy },
    ],
    [t]
  );
  const items = navItems ?? defaultNav;

  function closeMenu() {
    setMenuOpen(false);
  }

  function goCreate() {
    closeMenu();
    router.push(ROUTES.home);
  }

  const desktopNav = (
    <View
      className="landing-desktop-actions hidden md:flex"
      accessibilityRole="navigation"
      accessibilityLabel={t("landing:nav.mainNav")}
    >
      <View className="landing-desktop-nav">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={activeHref === item.href}
            itemClassName="landing-desktop-nav-item"
          />
        ))}
      </View>
      <LanguageToggle />
      <CreateButton label={t("common:actions.start")} onPress={goCreate} />
    </View>
  );

  const mobileNav = (
    <>
      <Pressable
        onPress={() => setMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("landing:nav.openMenu")}
        accessibilityState={{ expanded: menuOpen }}
        hitSlop={10}
        className={`w-11 h-11 rounded-2xl border border-sand-200 bg-sand-50 items-center justify-center active:bg-mint-100 shrink-0 ${
          Platform.OS === "web" ? "md:hidden" : isNativeMobile ? "" : "hidden"
        }`}
      >
        <View className="gap-1.5 w-5">
          <View className="h-0.5 rounded-full bg-sand-800" />
          <View className="h-0.5 rounded-full bg-sand-800" />
          <View className="h-0.5 rounded-full bg-melon-500" />
        </View>
      </Pressable>

      {!isNativeMobile && Platform.OS !== "web" ? (
        <View
          className="flex-row items-center gap-3 shrink-0"
          accessibilityRole="navigation"
          accessibilityLabel={t("landing:nav.mainNav")}
        >
          <View className="flex-row items-center gap-3">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={activeHref === item.href}
                itemClassName="shrink-0"
              />
            ))}
          </View>
          <LanguageToggle />
          <CreateButton label={t("common:actions.start")} onPress={goCreate} />
        </View>
      ) : null}
    </>
  );

  return (
    <SemanticWeb tag="header" className="border-b border-sand-200/70 bg-sand-50/95">
      <View className={`${maxW} mx-auto px-6 py-4 flex-row items-center justify-between gap-3`}>
        <Link href={ROUTES.landing} accessibilityLabel={t("common:actions.home")}>
          <View className="flex-row items-center gap-3 shrink min-w-0">
            <PastekLogoIcon size={36} accessibilityLabel={t("common:brand.name")} />
            <View className="min-w-0">
              <SemanticWeb tag="p" className="font-display text-lg text-sand-900 leading-5">
                {t("common:brand.name")}
              </SemanticWeb>
              <Text className="text-sage-600 text-[11px] tracking-wide hidden sm:flex">
                {t("common:brand.domain")}
              </Text>
            </View>
          </View>
        </Link>

        {Platform.OS === "web" ? (
          <>
            {mobileNav}
            {desktopNav}
          </>
        ) : (
          mobileNav
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
            accessibilityLabel={t("landing:nav.closeMenu")}
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
              <Text className="font-display text-xl text-sand-900">
                {t("landing:nav.menu")}
              </Text>
              <Pressable
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel={t("landing:nav.closeMenu")}
                hitSlop={10}
                className="w-10 h-10 rounded-full bg-mint-100 items-center justify-center"
              >
                <Text className="text-sage-800 text-lg font-semibold">×</Text>
              </Pressable>
            </View>

            <View className="mb-4">
              <LanguageToggle />
            </View>

            <View accessibilityRole="navigation" accessibilityLabel={t("landing:nav.mobileNav")}>
              {items.map((item) => (
                <View key={item.href} className="border-b border-sand-100 py-3">
                  <NavLink
                    item={item}
                    isActive={activeHref === item.href}
                    large
                    onPress={closeMenu}
                  />
                </View>
              ))}
            </View>

            <CreateButton
              label={t("common:actions.startCreating")}
              onPress={goCreate}
              className="mt-6 w-full items-center px-5 py-3.5 min-h-[48px]"
            />
          </View>
        </View>
      </Modal>
    </SemanticWeb>
  );
}
