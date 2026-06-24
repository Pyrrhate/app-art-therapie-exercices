import type { ReactNode, RefObject } from "react";
import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { refreshApplication } from "@/lib/navigation";
import { screenBg, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  showArrow?: boolean;
  align?: "center" | "start" | "stretch";
}

const primaryShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 8px 30px -12px rgba(73, 99, 73, 0.5)" } as const)
    : undefined;

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  showArrow = false,
  align = "stretch",
}: PrimaryButtonProps) {
  const isDark = useIsDark();
  const variants = {
    primary: "bg-sage-500 active:bg-sage-600",
    secondary: "bg-sage-500 active:bg-sage-600",
    ghost: isDark
      ? "bg-transparent border border-sand-600"
      : "bg-white border border-sand-200",
  };

  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    ghost: isDark ? "text-sand-200" : "text-sand-900",
  };

  const alignClass =
    align === "center"
      ? "self-center"
      : align === "start"
        ? "self-start"
        : "self-stretch";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`rounded-full px-8 py-4 min-h-[52px] items-center justify-center flex-row gap-2 ${alignClass} ${variants[variant]} ${disabled ? "opacity-40" : ""}`}
      style={variant !== "ghost" ? primaryShadow : undefined}
    >
      <Text className={`text-sm font-semibold tracking-wide ${textVariants[variant]}`}>
        {label}
      </Text>
      {showArrow && variant !== "ghost" ? (
        <Text className={`text-sm ${textVariants[variant]}`}>→</Text>
      ) : null}
    </Pressable>
  );
}

interface ScreenContainerProps {
  children: ReactNode;
  /** Petit label sage au-dessus du titre (style Pastek). */
  heroLabel?: string;
  title?: string;
  titleAccent?: string;
  titleEnd?: string;
  subtitle?: string;
  heroCentered?: boolean;
  heroSize?: "lg" | "md";
  scrollable?: boolean;
  /** Fond légèrement plus neutre pour l'écran exercice (mode focus). */
  variant?: "default" | "focus";
  /** Active le tirer-pour-actualiser (natif) ou le rechargement (web). */
  refreshable?: boolean;
  onRefresh?: () => void | Promise<void>;
  /** Pied de page fixe (ex. CTA exercice). */
  stickyFooter?: ReactNode;
  /** Barre fixe au-dessus du défilement (ex. navigation). */
  fixedHeader?: ReactNode;
  /** Moins de marge au-dessus du contenu (écrans avec Donate + nav en tête). */
  compactTop?: boolean;
  scrollRef?: RefObject<ScrollView>;
  contentMaxWidth?: number;
}

const webScrollShell =
  Platform.OS === "web"
    ? ({ flex: 1, minHeight: 0, height: "100%" } as const)
    : ({ flex: 1 } as const);

export function ScreenContainer({
  children,
  title,
  subtitle,
  scrollable = true,
  variant = "default",
  refreshable = false,
  onRefresh,
  stickyFooter,
  fixedHeader,
  scrollRef,
  contentMaxWidth = 720,
  heroLabel,
  titleAccent,
  titleEnd,
  heroCentered,
  heroSize,
  compactTop = false,
}: ScreenContainerProps) {
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await refreshApplication(async () => {
          await new Promise((resolve) => setTimeout(resolve, 350));
        });
      }
    } finally {
      if (Platform.OS !== "web") {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const refreshControl =
    refreshable && scrollable ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={["#496349"]}
        tintColor="#496349"
        title={Platform.OS === "ios" ? "Actualiser…" : undefined}
      />
    ) : undefined;

  const bgClass = screenBg(isDark, variant === "focus");
  const paddingTop = compactTop
    ? Platform.OS === "web"
      ? 0
      : insets.top
    : Math.max(insets.top, Platform.OS === "web" ? 48 : 56);

  const header =
    title || heroLabel ? (
      <PastekScreenHero
        label={heroLabel}
        title={title ?? ""}
        accent={titleAccent}
        titleEnd={titleEnd}
        description={subtitle}
        centered={heroCentered ?? Boolean(heroLabel)}
        size={heroSize ?? (heroLabel ? "lg" : "md")}
        className="mb-6"
      />
    ) : null;

  const webShellStyle =
    Platform.OS === "web"
      ? ({ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center" as const } as const)
      : { maxWidth: contentMaxWidth, width: "100%", alignSelf: "center" as const };

  const footerPaddingBottom = Math.max(insets.bottom, Platform.OS === "web" ? 24 : 16);
  const footerBg = isDark ? "bg-sand-900/95" : variant === "focus" ? "bg-sand-100/95" : "bg-sand-50/95";
  const footerBorder = isDark ? "border-sand-700" : "border-sand-200";

  if (stickyFooter) {
    return (
      <View className={`flex-1 ${bgClass}`} style={webScrollShell}>
        {fixedHeader ? (
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop,
              paddingBottom: 4,
            }}
          >
            <View style={webShellStyle}>{fixedHeader}</View>
          </View>
        ) : null}
        <ScrollView
          ref={scrollRef}
          style={webScrollShell}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: fixedHeader ? 0 : paddingTop,
            paddingBottom: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === "web"}
          nestedScrollEnabled
          refreshControl={refreshControl}
        >
          <View style={webShellStyle}>
            {header}
            {children}
          </View>
        </ScrollView>
        <View
          className={`border-t px-6 pt-4 ${footerBorder} ${footerBg}`}
          style={{
            paddingBottom: footerPaddingBottom,
            ...(Platform.OS === "web"
              ? ({ backdropFilter: "blur(8px)" } as const)
              : null),
          }}
        >
          <View style={webShellStyle}>{stickyFooter}</View>
        </View>
      </View>
    );
  }

  if (scrollable) {
    return (
      <View className={`flex-1 ${bgClass}`} style={webScrollShell}>
        {fixedHeader ? (
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop,
              paddingBottom: 4,
            }}
          >
            <View style={webShellStyle}>{fixedHeader}</View>
          </View>
        ) : null}
        <ScrollView
          ref={scrollRef}
          style={webScrollShell}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: fixedHeader ? 0 : paddingTop,
            paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 56 : 32),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === "web"}
          nestedScrollEnabled
          refreshControl={refreshControl}
        >
          <View style={webShellStyle}>
            {header}
            {children}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      className={`flex-1 ${bgClass} px-6 pb-8`}
      style={[
        { paddingTop, paddingBottom: Math.max(insets.bottom, 32) },
        webScrollShell,
      ]}
    >
      <View style={webShellStyle}>
        {header}
        {children}
      </View>
    </View>
  );
}
