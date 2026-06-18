import type { ReactNode } from "react";
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
import { DisplayTitle } from "@/components/ui/DisplayText";
import { refreshApplication } from "@/lib/navigation";
import { screenBg, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const isDark = useIsDark();
  const variants = {
    primary: "bg-sage-500 active:bg-sage-600",
    secondary: "bg-clay-400 active:bg-clay-500",
    ghost: isDark
      ? "bg-transparent border border-sand-600"
      : "bg-transparent border border-sand-300",
  };

  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    ghost: isDark ? "text-sand-200" : "text-sand-700",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`rounded-2xl px-6 py-4 min-h-[48px] items-center justify-center ${variants[variant]} ${disabled ? "opacity-40" : ""}`}
    >
      <Text className={`text-base font-medium ${textVariants[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ScreenContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  /** Fond légèrement plus neutre pour l'écran exercice (mode focus). */
  variant?: "default" | "focus";
  /** Active le tirer-pour-actualiser (natif) ou le rechargement (web). */
  refreshable?: boolean;
  onRefresh?: () => void | Promise<void>;
  /** Pied de page fixe (ex. CTA exercice). */
  stickyFooter?: ReactNode;
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
        colors={["#6B8F71"]}
        tintColor="#6B8F71"
        title={Platform.OS === "ios" ? "Actualiser…" : undefined}
      />
    ) : undefined;

  const bgClass = screenBg(isDark, variant === "focus");
  const paddingTop = Math.max(insets.top, Platform.OS === "web" ? 48 : 56);

  const header = (
    <>
      {title && <DisplayTitle className="mb-2">{title}</DisplayTitle>}
      {subtitle && (
        <Text className={`text-base mb-8 leading-6 ${textSecondary(isDark)}`}>
          {subtitle}
        </Text>
      )}
    </>
  );

  const webShellStyle =
    Platform.OS === "web"
      ? ({ maxWidth: 680, width: "100%", alignSelf: "center" as const } as const)
      : undefined;

  const footerPaddingBottom = Math.max(insets.bottom, Platform.OS === "web" ? 24 : 16);
  const footerBg = isDark ? "bg-sand-900/95" : variant === "focus" ? "bg-sand-100/95" : "bg-sand-50/95";
  const footerBorder = isDark ? "border-sand-700" : "border-sand-200";

  if (stickyFooter) {
    return (
      <View className={`flex-1 ${bgClass}`} style={webScrollShell}>
        <ScrollView
          style={webScrollShell}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop,
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
        <ScrollView
          style={webScrollShell}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop,
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
