import { create } from "zustand";
import {
  getLanguagePreference,
  setLanguagePreference,
} from "@/lib/preferences";
import i18n, { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { resolveInitialLanguage } from "@/lib/i18n/detect";
import { syncDocumentLanguage } from "@/lib/i18n/syncDocumentLang";
import type { AppLanguage } from "@/lib/i18n/types";

interface LanguageStore {
  language: AppLanguage;
  ready: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: DEFAULT_LANGUAGE,
  ready: false,
  hydrate: async () => {
    if (get().ready) return;
    const stored = await getLanguagePreference();
    const language = resolveInitialLanguage(stored);
    if (!stored) {
      await setLanguagePreference(language);
    }
    await i18n.changeLanguage(language);
    syncDocumentLanguage(language);
    set({ language, ready: true });
  },
  setLanguage: async (language) => {
    await setLanguagePreference(language);
    await i18n.changeLanguage(language);
    syncDocumentLanguage(language);
    set({ language });
  },
}));
