import { Text, View } from "react-native";
import { ColorSwatch } from "@/components/color-journey/ColorSwatch";
import {
  COLOR_JOURNEY_DIMENSIONS,
  COLOR_JOURNEY_TURN_COUNT,
} from "@/lib/color-journey/dimensions";
import type { ColorChoice } from "@/lib/color-journey/types";

interface JourneyProgressProps {
  currentTurn: number;
  history: ColorChoice[];
}

export function JourneyProgress({ currentTurn, history }: JourneyProgressProps) {
  return (
    <View className="mb-6">
      <Text className="text-sand-400 text-xs text-center mb-1 uppercase tracking-wider">
        Étape {Math.min(currentTurn, COLOR_JOURNEY_TURN_COUNT)} /{" "}
        {COLOR_JOURNEY_TURN_COUNT}
      </Text>
      <Text className="text-sand-500 text-xs text-center mb-3">
        {COLOR_JOURNEY_DIMENSIONS[Math.min(currentTurn, COLOR_JOURNEY_TURN_COUNT) - 1]
          ?.title ?? "Palette"}
      </Text>
      <View className="flex-row justify-center gap-2 flex-wrap px-2">
        {Array.from({ length: COLOR_JOURNEY_TURN_COUNT }, (_, i) => {
          const choice = history[i];
          const isCurrent = i + 1 === currentTurn && !choice;
          const role = COLOR_JOURNEY_DIMENSIONS[i]?.title.split(" ").pop();
          return (
            <View key={i} className="items-center">
              <ColorSwatch
                hex={choice?.hex ?? "#FAF7F4"}
                size={28}
                className={
                  isCurrent
                    ? "border-2 border-sage-500"
                    : choice
                      ? "border-2 border-sand-200"
                      : "border-2 border-dashed border-sand-300"
                }
              />
              <Text className="text-sand-400 text-[10px] mt-1 capitalize">
                {role ?? ""}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
