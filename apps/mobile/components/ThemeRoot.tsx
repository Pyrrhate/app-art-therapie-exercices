import type { ReactNode } from "react";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { KofiDonateLink } from "@/components/ui/KofiDonateLink";
import { THEME_COLORS, useThemeStore } from "@/lib/themeStore";

export function ThemeRoot({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const hydrate = useThemeStore((s) => s.hydrate);
  const isDark = theme === "dark";
  const colors = THEME_COLORS[theme];

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    document.body.style.backgroundColor = colors.root;
    const appRoot = document.getElementById("root");
    if (appRoot) appRoot.style.backgroundColor = colors.root;
  }, [isDark, colors.root]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.root, minHeight: 0 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
      <KofiDonateLink />
    </View>
  );
}
