import { Platform, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import type { ExperienceMode } from "@/lib/experience/types";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const DEPTH_MODES: {
  id: ExperienceMode;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "express",
    title: "Session Rapide",
    subtitle: "Parcours express",
    description:
      "Exercice sur-mesure puis analyse directe de votre création.",
    icon: "→",
  },
  {
    id: "deep",
    title: "Session Approfondie",
    subtitle: "Parcours guidé",
    description:
      "Ancrage avant l'analyse, puis pistes d'intégration pour clore la séance.",
    icon: "◎",
  },
];

interface CustomDepthSelectorProps {
  value: ExperienceMode;
  onChange: (mode: ExperienceMode) => void;
}

export function CustomDepthSelector({
  value,
  onChange,
}: CustomDepthSelectorProps) {
  const isDark = useIsDark();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Choisir la profondeur de la séance"
      className="gap-3"
    >
      <Text className={`text-sm font-medium mb-1 ${textPrimary(isDark)}`}>
        Profondeur de la séance
      </Text>

      <View className="flex-row gap-3">
        {DEPTH_MODES.map((mode) => {
          const selected = value === mode.id;
          return (
            <Pressable
              key={mode.id}
              onPress={() => onChange(mode.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${mode.title} — ${mode.description}`}
              className="flex-1 active:opacity-90 focus:opacity-90"
            >
              <Card
                variant={selected ? "accent" : "content"}
                className={`p-4 rounded-2xl min-h-[148px] justify-between ${
                  Platform.OS === "web" ? "web:transition-colors web:duration-200" : ""
                }`}
              >
                <Text className="text-sage-500 text-xl mb-2">{mode.icon}</Text>
                <Text className={`font-semibold text-sm ${textPrimary(isDark)}`}>
                  {mode.title}
                </Text>
                <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`}>
                  {mode.subtitle}
                </Text>
                <Text className={`text-xs mt-2 leading-5 ${textSecondary(isDark)}`}>
                  {mode.description}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
