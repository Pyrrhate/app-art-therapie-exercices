import { Text, View } from "react-native";
import { COLOR_JOURNEY_TURN_COUNT } from "@/lib/color-journey/dimensions";
import type { ColorChoice } from "@/lib/color-journey/types";

interface JourneyProgressProps {
  currentTurn: number;
  history: ColorChoice[];
}

export function JourneyProgress({ currentTurn, history }: JourneyProgressProps) {
  return (
    <View className="mb-6">
      <Text className="text-sand-400 text-xs text-center mb-3 uppercase tracking-wider">
        Tour {Math.min(currentTurn, COLOR_JOURNEY_TURN_COUNT)} /{" "}
        {COLOR_JOURNEY_TURN_COUNT}
      </Text>
      <View className="flex-row justify-center gap-2 flex-wrap px-2">
        {Array.from({ length: COLOR_JOURNEY_TURN_COUNT }, (_, i) => {
          const choice = history[i];
          const isCurrent = i + 1 === currentTurn && !choice;
          return (
            <View
              key={i}
              className={`rounded-full border-2 ${
                isCurrent
                  ? "border-sage-500"
                  : choice
                    ? "border-sand-200"
                    : "border-dashed border-sand-300"
              }`}
              style={{
                width: 28,
                height: 28,
                backgroundColor: choice?.hex ?? "#FAF7F4",
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
