import { Pressable, Text } from "react-native";
import { openSupportUrl } from "@/lib/support";
import { useIsDark } from "@/lib/themeStore";

interface KofiDonateLinkProps {
  /** Icône seule (défaut) ou libellé court */
  variant?: "icon" | "label";
}

/** Lien Ko-fi compact pour barres de navigation. */
export function KofiDonateLink({ variant = "icon" }: KofiDonateLinkProps) {
  const isDark = useIsDark();

  if (variant === "label") {
    return (
      <Pressable
        onPress={() => void openSupportUrl()}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel="Soutenir sur Ko-fi"
        className={`rounded-full px-2.5 py-1 border ${
          isDark ? "border-sand-600 bg-sand-800/60" : "border-sand-200 bg-white"
        }`}
      >
        <Text className="text-sage-500 text-xs font-medium">☕ Ko-fi</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void openSupportUrl()}
      hitSlop={10}
      accessibilityRole="link"
      accessibilityLabel="Soutenir sur Ko-fi"
      className={`w-9 h-9 rounded-full items-center justify-center border ${
        isDark ? "border-sand-600 bg-sand-800/60" : "border-sand-200 bg-white"
      }`}
    >
      <Text className="text-base leading-none">☕</Text>
    </Pressable>
  );
}
