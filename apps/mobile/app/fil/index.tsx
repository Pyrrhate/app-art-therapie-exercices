import { useCallback, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { clearFilEntries, getFilEntries } from "@/lib/fil/storage";
import { FIL_SOURCE_META, type FilEntry } from "@/lib/fil/types";
import { navigateHome } from "@/lib/navigation";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function FilScreen() {
  const isDark = useIsDark();
  const [entries, setEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setEntries(await getFilEntries());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function handleClear() {
    const run = async () => {
      await clearFilEntries();
      setEntries([]);
    };
    if (Platform.OS === "web") {
      if (window.confirm("Effacer tout le Fil créatif ?")) void run();
      return;
    }
    Alert.alert(
      "Effacer le Fil ?",
      "Toutes les traces seront supprimées de cet appareil.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Effacer", style: "destructive", onPress: () => void run() },
      ]
    );
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={load}>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <PastekScreenHero
        label="Fil créatif"
        title="Mémoire de vos "
        accent="pratiques"
        description="Sur cet appareil, de petites traces laissées après vos exercices et modules — mandala, nuances, jardin, ping-pong, rituel."
        className="mb-6"
      />

      {loading ? (
        <Text className={textMuted(isDark)}>Chargement…</Text>
      ) : entries.length === 0 ? (
        <View
          className={`rounded-3xl border border-dashed px-5 py-10 items-center ${panelBg(isDark)}`}
        >
          <Text className={`text-center leading-6 ${textSecondary(isDark)}`}>
            Rien ici pour l&apos;instant. Terminez un exercice ou un module, puis ajoutez une trace pour vous en souvenir.
          </Text>
          <View className="mt-6 w-full gap-3">
            <PrimaryButton label="Préparer un exercice" onPress={() => router.push("/ritual")} />
            <PrimaryButton label="Retour à l'accueil" onPress={navigateHome} variant="ghost" />
          </View>
        </View>
      ) : (
        <View className="gap-3 pb-6">
          {entries.map((entry) => {
            const meta = FIL_SOURCE_META[entry.source];
            return (
              <View
                key={entry.id}
                className={`rounded-3xl border px-5 py-4 ${panelBg(isDark)}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-xs ${textMuted(isDark)}`}>
                    {formatSessionDate(entry.createdAt)}
                  </Text>
                  <Text className={`text-xs ${textMuted(isDark)}`}>
                    {meta.emoji} {meta.label}
                  </Text>
                </View>
                <Text className={`font-medium text-base mb-1 ${textPrimary(isDark)}`}>
                  {entry.summary}
                </Text>
                {entry.detail ? (
                  <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
                    {entry.detail}
                  </Text>
                ) : null}
                {entry.metadata?.colors?.length ? (
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {entry.metadata.colors.map((hex) => (
                      <View
                        key={hex}
                        className={`w-6 h-6 rounded-full border ${isDark ? "border-sand-600" : "border-sand-200"}`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View className={`gap-3 pt-4 border-t ${isDark ? "border-sand-700" : "border-sand-200"}`}>
            <PrimaryButton
              label="Préparer un exercice"
              onPress={() => router.push("/ritual")}
            />
            <PrimaryButton
              label="Effacer le Fil"
              onPress={handleClear}
              variant="ghost"
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
