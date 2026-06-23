import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openSupportUrl } from "@/lib/support";
import { useIsDark } from "@/lib/themeStore";

/** Lien Ko-fi fixé en haut à droite de l'écran (top 0). */
export function KofiDonateLink() {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        left: 0,
        zIndex: 100,
        paddingTop: topInset,
        paddingRight: 16,
        alignItems: "flex-end",
      }}
    >
      <Pressable
        onPress={() => void openSupportUrl()}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel="Donate — soutenir le projet sur Ko-fi"
        className={`rounded-full px-3 py-1.5 border ${
          isDark ? "border-sand-600 bg-sand-900/90" : "border-sand-200 bg-white/95"
        }`}
        style={
          Platform.OS === "web"
            ? ({ backdropFilter: "blur(8px)" } as const)
            : undefined
        }
      >
        <Text className="text-sage-500 text-sm font-medium">Donate</Text>
      </Pressable>
    </View>
  );
}
