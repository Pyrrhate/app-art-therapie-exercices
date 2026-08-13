import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { EvolutionTriggers } from "@/lib/experience/types";
import { AccentCard } from "@/components/ui/Card";
import { WorkflowStepTransition } from "@/components/experience/WorkflowStepTransition";

interface AugmentedExerciseBannerProps {
  triggers?: EvolutionTriggers | null;
  className?: string;
}

function TriggerChips({ triggers }: { triggers: EvolutionTriggers }) {
  const chips = [
    ...(triggers.dominantThemes ?? []).slice(0, 2),
    ...(triggers.deepeningGoals ?? []).slice(0, 1),
  ].filter(Boolean);

  if (!chips.length) return null;

  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {chips.map((chip, i) => (
        <View
          key={`${chip}-${i}`}
          className="bg-sage-100 border border-sage-200 rounded-full px-3 py-1"
        >
          <Text className="text-sage-700 text-xs">{chip}</Text>
        </View>
      ))}
    </View>
  );
}

export function AugmentedExerciseBanner({
  triggers,
  className = "",
}: AugmentedExerciseBannerProps) {
  const { t } = useTranslation("ritual");

  return (
    <WorkflowStepTransition stepKey="augmented-banner">
      <AccentCard className={`mb-3 px-4 py-3 ${className}`}>
        <Text className="text-sage-700 text-sm font-medium">
          {t("augmented.title")}
        </Text>
        <Text className="text-sand-600 text-xs leading-5 mt-1">
          {t("augmented.body")}
        </Text>
        {triggers ? <TriggerChips triggers={triggers} /> : null}
      </AccentCard>
    </WorkflowStepTransition>
  );
}
