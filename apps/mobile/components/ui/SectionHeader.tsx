import { Text, View } from "react-native";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface SectionHeaderProps {
  label: string;
  title: string;
  accent?: string;
  titleEnd?: string;
  className?: string;
}

export function SectionHeader({
  label,
  title,
  accent,
  titleEnd = "",
  className = "",
}: SectionHeaderProps) {
  const isDark = useIsDark();

  return (
    <View className={`mb-8 ${className}`}>
      <Text className="text-sage-500 text-xs uppercase tracking-[0.2em] mb-4 font-medium">
        {label}
      </Text>
      <Text
        className={`font-display text-3xl leading-tight ${textPrimary(isDark)}`}
        style={{ letterSpacing: -0.5 }}
      >
        {title}
        {accent ? (
          <Text className="text-sage-500 font-display">{accent}</Text>
        ) : null}
        {titleEnd}
      </Text>
    </View>
  );
}
