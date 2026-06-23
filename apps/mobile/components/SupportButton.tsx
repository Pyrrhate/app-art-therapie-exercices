import { Pressable, Text } from "react-native";
import { openSupportUrl } from "@/lib/support";

interface SupportButtonProps {
  variant?: "compact" | "full";
}

export function SupportButton({ variant = "full" }: SupportButtonProps) {
  if (variant === "compact") {
    return (
      <Pressable onPress={() => void openSupportUrl()} className="py-2">
        <Text className="text-sage-500 text-sm text-center underline">
          Soutenir le projet ☕
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void openSupportUrl()}
      className="bg-sand-100 border border-sand-200 rounded-2xl px-6 py-5 items-center"
    >
      <Text className="text-sand-700 text-base font-medium mb-1">
        Soutenir le projet
      </Text>
      <Text className="text-sand-500 text-sm text-center leading-5">
        Aidez à maintenir cette application gratuite et bienveillante.
      </Text>
    </Pressable>
  );
}
