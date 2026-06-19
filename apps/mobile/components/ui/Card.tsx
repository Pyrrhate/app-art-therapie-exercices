import type { ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { useIsDark } from "@/lib/themeStore";

type CardVariant = "surface" | "content" | "accent";

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

const webShadowStyle =
  Platform.OS === "web"
    ? ({ boxShadow: "0 2px 20px rgba(73, 99, 73, 0.06)" } as const)
    : undefined;

function variantClasses(variant: CardVariant, isDark: boolean): string {
  if (isDark) {
    switch (variant) {
      case "surface":
        return "bg-sand-800 border border-sand-700";
      case "content":
        return "bg-sand-800 border border-sand-700";
      case "accent":
        return "bg-sand-800 border border-sage-600/40 border-l-4 border-l-sage-500";
    }
  }
  switch (variant) {
    case "surface":
      return "bg-sand-100 border border-sand-100";
    case "content":
      return "bg-white border border-sand-100";
    case "accent":
      return "bg-sage-50 border border-sage-100 border-l-4 border-l-sage-500";
  }
}

export function Card({
  children,
  variant = "content",
  className = "",
  style,
  ...props
}: CardProps) {
  const isDark = useIsDark();
  const shadow = variant === "content" && !isDark ? webShadowStyle : undefined;

  return (
    <View
      className={`rounded-3xl px-5 py-5 ${variantClasses(variant, isDark)} ${className}`}
      style={[shadow, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export function ContentCard(props: Omit<CardProps, "variant">) {
  return <Card variant="content" {...props} />;
}

export function AccentCard(props: Omit<CardProps, "variant">) {
  return <Card variant="accent" {...props} />;
}

export function SurfaceCard(props: Omit<CardProps, "variant">) {
  return <Card variant="surface" {...props} />;
}
