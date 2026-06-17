import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/ui/Button";
import { AccentCard } from "@/components/ui/Card";

interface BridgeAction {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

interface CreativeBridgeProps {
  title: string;
  subtitle?: string;
  actions: BridgeAction[];
}

export function CreativeBridge({
  title,
  subtitle,
  actions,
}: CreativeBridgeProps) {
  return (
    <AccentCard className="mt-4 gap-3">
      <Text className="text-sage-700 font-medium text-base">{title}</Text>
      {subtitle ? (
        <Text className="text-sand-600 text-sm leading-6">{subtitle}</Text>
      ) : null}
      {actions.map((action) => (
        <PrimaryButton
          key={action.label}
          label={action.label}
          onPress={action.onPress}
          variant={action.variant ?? "secondary"}
          disabled={action.disabled}
        />
      ))}
    </AccentCard>
  );
}
