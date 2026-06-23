import { Text, View } from "react-native";
import type { MultimodalWorkflowStep } from "@/lib/multimodal/types";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const STEPS: { id: MultimodalWorkflowStep; label: string }[] = [
  { id: "media", label: "Expression" },
  { id: "questionnaire", label: "Ressenti" },
  { id: "upload", label: "Média" },
  { id: "analyzing", label: "Analyse" },
];

interface StepIndicatorProps {
  current: MultimodalWorkflowStep;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const isDark = useIsDark();
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: STEPS.length,
        now: currentIndex + 1,
        text: `Étape ${currentIndex + 1} sur ${STEPS.length}`,
      }}
      className="flex-row items-center justify-between mb-8 gap-1"
    >
      {STEPS.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        return (
          <View key={step.id} className="flex-1 items-center gap-1.5">
            <View
              className={`h-1.5 w-full rounded-full ${
                active || done ? "bg-sage-500" : isDark ? "bg-sand-700" : "bg-sand-200"
              }`}
            />
            <Text
              className={`text-[10px] uppercase tracking-wider ${
                active ? "text-sage-600 font-semibold" : textMuted(isDark)
              }`}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
