import { Text, View } from "react-native";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { panelBg, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/**
 * Remplace l'ancien panneau compte Supabase : Pastek est local-first.
 */
export function AccountPanel({ className = "" }: { className?: string }) {
  const isDark = useIsDark();

  return (
    <View className={`gap-3 ${className}`}>
      <View className={`rounded-3xl border px-5 py-5 gap-3 ${panelBg(isDark)}`}>
        <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
          Compte
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          Aucun compte Pastek requis. L&apos;app fonctionne hors ligne sur cet
          appareil. Optionnel : connectez Google Drive ci-dessous pour
          sauvegarder votre Fil.
        </Text>
      </View>
      <StorageSettings />
    </View>
  );
}
