import type { ReactNode } from "react";
import { Platform, Text, type TextProps } from "react-native";
import { textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface DisplayTextProps extends TextProps {
  children: ReactNode;
  className?: string;
}

const nativeDisplayFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: undefined,
});

export function DisplayTitle({
  children,
  className = "",
  style,
  ...props
}: DisplayTextProps) {
  const isDark = useIsDark();

  return (
    <Text
      className={`font-display text-3xl font-light leading-tight ${textPrimary(isDark)} ${className}`}
      style={[
        Platform.OS !== "web" && nativeDisplayFont
          ? { fontFamily: nativeDisplayFont }
          : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

export function DisplayHero({
  children,
  className = "",
  style,
  ...props
}: DisplayTextProps) {
  const isDark = useIsDark();

  return (
    <Text
      className={`font-display text-4xl font-light leading-tight ${textPrimary(isDark)} ${className}`}
      style={[
        Platform.OS !== "web" && nativeDisplayFont
          ? { fontFamily: nativeDisplayFont }
          : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
