import { Alert, Pressable, Text } from "react-native";

interface SupportButtonProps {
  variant?: "compact" | "full";
}

/**
 * Placeholder pour intégration future Ko-fi / Stripe / Buy Me a Coffee.
 */
export function SupportButton({ variant = "full" }: SupportButtonProps) {
  function handlePress() {
    Alert.alert(
      "Soutenir le projet",
      "Merci pour votre générosité ! L'intégration de paiement sera disponible prochainement.",
      [{ text: "Compris", style: "default" }]
    );
  }

  if (variant === "compact") {
    return (
      <Pressable onPress={handlePress} className="py-2">
        <Text className="text-sage-500 text-sm text-center underline">
          Soutenir le projet ☕
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
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
