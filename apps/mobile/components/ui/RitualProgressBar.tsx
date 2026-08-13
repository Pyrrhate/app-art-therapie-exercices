import { Fragment } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/lib/themeStore";

export type RitualStep = "ritual" | "exercise" | "reflection";

const STEPS: { id: RitualStep; labelKey: string }[] = [
  { id: "ritual", labelKey: "progress.impulse" },
  { id: "exercise", labelKey: "progress.exercise" },
  { id: "reflection", labelKey: "progress.reflection" },
];

const TRACK_WIDTH = 260;

interface RitualProgressBarProps {
  current: RitualStep;
}

export function RitualProgressBar({ current }: RitualProgressBarProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  const currentLabelKey = STEPS[currentIndex]?.labelKey;

  return (
    <View
      className="mb-6 items-center"
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: STEPS.length - 1,
        now: currentIndex,
        text: t("progress.status", {
          current: currentIndex + 1,
          total: STEPS.length,
          label: currentLabelKey ? t(currentLabelKey) : "",
        }),
      }}
    >
      <View
        className="flex-row items-center mb-2 self-center"
        style={{ width: TRACK_WIDTH }}
      >
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <Fragment key={step.id}>
              <View
                className={`w-3 h-3 rounded-full shrink-0 ${
                  isCurrent
                    ? "bg-sage-500"
                    : isDone
                      ? "bg-sage-400"
                      : isDark
                        ? "bg-sand-600"
                        : "bg-sand-200"
                }`}
              />
              {!isLast && (
                <View
                  className={`flex-1 h-0.5 mx-2 ${
                    isDone ? "bg-sage-300" : isDark ? "bg-sand-700" : "bg-sand-200"
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </View>

      <View
        className="flex-row self-center"
        style={{ width: TRACK_WIDTH }}
      >
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <Text
              key={step.id}
              className={`flex-1 text-xs text-center ${
                isCurrent
                  ? "text-sage-600 font-medium"
                  : isDone
                    ? isDark
                      ? "text-sand-400"
                      : "text-sand-500"
                    : isDark
                      ? "text-sand-500"
                      : "text-sand-400"
              }`}
              numberOfLines={1}
            >
              {t(step.labelKey)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
