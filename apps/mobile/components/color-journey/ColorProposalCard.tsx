import { Pressable, Text, View } from "react-native";
import type { ColorProposal } from "@/lib/color-journey/types";

interface ColorProposalCardProps {
  proposal: ColorProposal;
  onPress: () => void;
  disabled?: boolean;
}

export function ColorProposalCard({
  proposal,
  onPress,
  disabled = false,
}: ColorProposalCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center rounded-2xl border px-4 py-4 mb-3 active:border-sage-400 ${
        disabled ? "opacity-50 border-sand-200 bg-sand-50" : "border-sand-200 bg-white"
      }`}
    >
      <View
        className="rounded-full border border-sand-200 mr-4"
        style={{ width: 48, height: 48, backgroundColor: proposal.hex }}
      />
      <View className="flex-1">
        <Text className="text-sand-800 font-medium text-base mb-1">
          {proposal.label}
        </Text>
        <Text className="text-sand-500 text-sm leading-5">{proposal.hint}</Text>
        <Text className="text-sand-300 text-xs mt-1">{proposal.hex}</Text>
      </View>
    </Pressable>
  );
}
