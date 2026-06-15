import { Text, View } from "react-native";
import type { JourneyReflection } from "@/lib/color-journey/types";

interface ReflectionPanelProps {
  data: JourneyReflection;
}

export function ReflectionPanel({ data }: ReflectionPanelProps) {
  return (
    <View className="bg-white rounded-2xl border border-sage-200 px-5 py-5 mb-4">
      <View className="flex-row items-center mb-3">
        <View
          className="rounded-full border border-sand-200 mr-3"
          style={{ width: 32, height: 32, backgroundColor: data.chosen.hex }}
        />
        <Text className="text-sage-700 font-medium flex-1">{data.chosen.label}</Text>
      </View>
      <Text className="text-sand-700 text-base leading-7 mb-3">
        {data.reflection}
      </Text>
      <Text className="text-sand-500 text-sm leading-6 mb-2">
        {data.psychology}
      </Text>
      <Text className="text-sand-400 text-sm leading-6 italic mb-2">
        {data.theory}
      </Text>
      {data.question ? (
        <Text className="text-sage-600 text-sm leading-6 mt-2">
          · {data.question}
        </Text>
      ) : null}
    </View>
  );
}
