import { createElement, type ReactNode } from "react";
import { Platform, Text, View, type ViewProps } from "react-native";

type SemanticTag =
  | "header"
  | "main"
  | "section"
  | "article"
  | "footer"
  | "nav"
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "ul"
  | "li";

const TEXT_TAGS = new Set<SemanticTag>(["h1", "h2", "h3", "p", "li"]);

interface SemanticWebProps extends ViewProps {
  tag: SemanticTag;
  className?: string;
  children?: ReactNode;
  id?: string;
  role?: string;
  "aria-label"?: string;
}

/** Balises HTML5 sémantiques sur le web, fallback RN sur mobile. */
export function SemanticWeb({
  tag,
  className,
  children,
  ...rest
}: SemanticWebProps) {
  if (Platform.OS === "web") {
    return createElement(tag, { className, ...rest }, children);
  }

  if (TEXT_TAGS.has(tag)) {
    return (
      <Text className={className} accessibilityRole="text" {...rest}>
        {children}
      </Text>
    );
  }

  return (
    <View className={className} {...rest}>
      {children}
    </View>
  );
}
