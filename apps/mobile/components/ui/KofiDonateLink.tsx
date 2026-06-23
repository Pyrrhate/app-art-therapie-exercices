import { Platform, Pressable, Text, View } from "react-native";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getScreenContentMaxWidth,
  SCREEN_CONTENT_PADDING_X,
} from "@/lib/layout";
import { openSupportUrl } from "@/lib/support";
import { useIsDark } from "@/lib/themeStore";

/** Lien Ko-fi fixé en haut, aligné à droite dans la colonne de contenu. */
export function KofiDonateLink() {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const contentMaxWidth = getScreenContentMaxWidth(pathname);
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: topInset,
        paddingHorizontal: SCREEN_CONTENT_PADDING_X,
      }}
    >
      <View
        pointerEvents="box-none"
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          alignSelf: "center",
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
    </View>
  );
}
