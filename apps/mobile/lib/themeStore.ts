import { create } from "zustand";
import { getThemePreference, setThemePreference, type ThemePreference } from "./preferences";

interface ThemeState {
  theme: ThemePreference;
  ready: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  ready: false,
  hydrate: async () => {
    const theme = await getThemePreference();
    set({ theme, ready: true });
  },
  setTheme: async (theme) => {
    await setThemePreference(theme);
    set({ theme });
  },
}));

export function useIsDark(): boolean {
  return useThemeStore((s) => s.theme === "dark");
}

export const THEME_COLORS = {
  light: {
    root: "#FAF5EF",
    screen: "#FAF5EF",
    screenFocus: "#F3EBE0",
  },
  dark: {
    root: "#2A3F35",
    screen: "#2A3F35",
    screenFocus: "#385547",
  },
} as const;
