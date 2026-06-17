import { Text, View } from "react-native";

export type RitualStep = "ritual" | "exercise" | "reflection";

const STEPS: { id: RitualStep; label: string }[] = [
  { id: "ritual", label: "Impulsion" },
  { id: "exercise", label: "Exercice" },
  { id: "reflection", label: "Réflexion" },
];

interface RitualProgressBarProps {
  current: RitualStep;
}

export function RitualProgressBar({ current }: RitualProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <View
      className="mb-6"
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: STEPS.length - 1,
        now: currentIndex,
        text: `Étape ${currentIndex + 1} sur ${STEPS.length} — ${STEPS[currentIndex]?.label}`,
      }}
    >
      <View className="flex-row items-center gap-1">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <View key={step.id} className="flex-1 flex-row items-center">
              <View className="flex-1 items-center gap-1.5">
                <View
                  className={`w-3 h-3 rounded-full ${
                    isCurrent
                      ? "bg-sage-500"
                      : isDone
                        ? "bg-sage-400"
                        : "bg-sand-200"
                  }`}
                />
                <Text
                  className={`text-xs text-center ${
                    isCurrent
                      ? "text-sage-600 font-medium"
                      : isDone
                        ? "text-sand-500"
                        : "text-sand-400"
                  }`}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
              {!isLast && (
                <View
                  className={`h-0.5 flex-1 -mt-4 mx-0.5 ${
                    isDone ? "bg-sage-300" : "bg-sand-200"
                  }`}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
