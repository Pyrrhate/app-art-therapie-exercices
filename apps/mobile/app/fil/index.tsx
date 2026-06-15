import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { clearFilEntries, getFilEntries } from "@/lib/fil/storage";
import { FIL_SOURCE_META, type FilEntry } from "@/lib/fil/types";
import { navigateHome } from "@/lib/navigation";

export default function FilScreen() {
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
    <ScreenContainer scrollable={false}>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
        Fil créatif
      </Text>
      <Text className="text-3xl font-light text-sand-800 mb-2 leading-tight">
        Vos traces en douceur
      </Text>
      <Text className="text-sand-500 text-base leading-6 mb-6">
        Un fil local qui relie vos moments — mandala, nuances, ping-pong, rituel.
      </Text>

      {loading ? (
        <Text className="text-sand-400">Chargement…</Text>
      ) : entries.length === 0 ? (
        <View className="bg-white rounded-2xl border border-dashed border-sand-300 px-5 py-10 items-center">
          <Text className="text-sand-500 text-center leading-6">
            Rien ici pour l&apos;instant. À la fin d&apos;un module, ajoutez une
            trace au Fil.
          </Text>
          <View className="mt-6 w-full">
            <PrimaryButton label="Retour à l'accueil" onPress={navigateHome} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
            showsVerticalScrollIndicator
          >
            {entries.map((entry) => {
              const meta = FIL_SOURCE_META[entry.source];
              return (
                <View
                  key={entry.id}
                  className="bg-white rounded-2xl border border-sand-200 px-5 py-4"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sand-400 text-xs">
                      {formatSessionDate(entry.createdAt)}
                    </Text>
                    <Text className="text-sand-500 text-xs">
                      {meta.emoji} {meta.label}
                    </Text>
                  </View>
                  <Text className="text-sand-800 font-medium text-base mb-1">
                    {entry.summary}
                  </Text>
                  {entry.detail ? (
                    <Text className="text-sand-600 text-sm leading-6">
                      {entry.detail}
                    </Text>
                  ) : null}
                  {entry.metadata?.colors?.length ? (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {entry.metadata.colors.map((hex) => (
                        <View
                          key={hex}
                          className="w-6 h-6 rounded-full border border-sand-200"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View className="gap-3 pt-4 border-t border-sand-200">
            <PrimaryButton
              label="Commencer un rituel"
              onPress={() => router.push("/ritual")}
            />
            <PrimaryButton
              label="Effacer le Fil"
              onPress={handleClear}
              variant="ghost"
            />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
