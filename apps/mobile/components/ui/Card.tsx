import type { ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";

type CardVariant = "surface" | "content" | "accent";

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  surface: "bg-sand-50 border border-sand-100",
  content: "bg-white border border-sand-200",
  accent: "bg-sage-50 border border-sage-100 border-l-4 border-l-sage-500",
};

const webShadowStyle =
  Platform.OS === "web"
    ? ({
        boxShadow: "0 2px 8px rgba(62, 52, 44, 0.07)",
      } as const)
    : undefined;

export function Card({
  children,
  variant = "content",
  className = "",
  style,
  ...props
}: CardProps) {
  const shadow = variant === "content" ? webShadowStyle : undefined;

  return (
    <View
      className={`rounded-2xl px-5 py-4 ${variantClasses[variant]} ${className}`}
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
