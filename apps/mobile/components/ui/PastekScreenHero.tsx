import { Pressable, Text, View } from "react-native";
import { textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface PastekScreenHeroProps {
  label?: string;
  title: string;
  accent?: string;
  titleEnd?: string;
  description?: string;
  centered?: boolean;
  size?: "lg" | "md";
  className?: string;
  onDescriptionPress?: () => void;
}

export function PastekScreenHero({
  label,
  title,
  accent,
  titleEnd = "",
  description,
  centered = true,
  size = "lg",
  className = "mb-8",
  onDescriptionPress,
}: PastekScreenHeroProps) {
  const isDark = useIsDark();
  const titleSize = size === "lg" ? "text-4xl" : "text-3xl";
  const align = centered ? "text-center items-center" : "";

  return (
    <View className={`${align} px-1 ${className}`}>
      {label ? (
        <Text className="text-sage-500 text-xs uppercase tracking-[0.2em] mb-4 font-medium text-center">
          {label}
        </Text>
      ) : null}

      <Text
        className={`font-display ${titleSize} leading-[1.12] ${centered ? "text-center" : ""} ${textPrimary(isDark)}`}
        style={{ letterSpacing: size === "lg" ? -1 : -0.5, maxWidth: centered ? 560 : undefined }}
      >
        {title}
        {accent ? (
          <Text className="text-sage-500 font-display">{accent}</Text>
        ) : null}
        {titleEnd}
      </Text>

      {description ? (
        onDescriptionPress ? (
          <Pressable
            onPress={onDescriptionPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour à l'accueil"
          >
            <Text
              className={`text-base leading-7 mt-4 max-w-lg ${centered ? "text-center" : ""} ${textSecondary(isDark)}`}
            >
              {description}
            </Text>
          </Pressable>
        ) : (
          <Text
            className={`text-base leading-7 mt-4 max-w-lg ${centered ? "text-center" : ""} ${textSecondary(isDark)}`}
          >
            {description}
          </Text>
        )
      ) : null}
    </View>
  );
}
