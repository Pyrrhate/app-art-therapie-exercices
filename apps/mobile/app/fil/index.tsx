import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PastekIcon } from "@/components/ui/ModuleIcon";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { clearFilEntries, deleteFilEntry, getFilEntries } from "@/lib/fil/storage";
import {
  confirmClearAllFil,
  confirmDeleteFilEntry,
} from "@/lib/fil/deleteConfirm";
import {
  FIL_SOURCE_META,
  isRitualFilEntry,
  type FilEntry,
} from "@/lib/fil/types";
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

  async function handleClear() {
    if (entries.length === 0) return;
    const confirmed = await confirmClearAllFil(entries.length);
    if (!confirmed) return;
    await clearFilEntries();
    setEntries([]);
  }

  async function handleDeleteEntry(entry: FilEntry) {
    const confirmed = await confirmDeleteFilEntry(entry.summary);
    if (!confirmed) return;
    await deleteFilEntry(entry.id);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={load}>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <PastekScreenHero
        label="Fil créatif"
        title="Mémoire de vos "
        accent="pratiques"
        description="Chaque rituel et chaque amorce laissent automatiquement une trace ici — sur cet appareil uniquement."
        className="mb-6"
      />

      {loading ? (
        <Text className={textMuted(isDark)}>Chargement…</Text>
      ) : entries.length === 0 ? (
        <View
          className={`rounded-3xl border border-dashed px-5 py-10 items-center ${panelBg(isDark)}`}
        >
          <Text className={`text-center leading-6 ${textSecondary(isDark)}`}>
            Rien ici pour l&apos;instant. Terminez un exercice ou une amorce — une trace s&apos;ajoutera toute seule.
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
            const preview =
              entry.metadata?.reflection?.slice(0, 120) ??
              entry.detail?.slice(0, 120);
            return (
              <Pressable
                key={entry.id}
                onPress={() => router.push(`/fil/${entry.id}`)}
                className={`rounded-3xl border px-5 py-4 ${panelBg(isDark)}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-xs ${textMuted(isDark)}`}>
                    {formatSessionDate(entry.createdAt)}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <PastekIcon
                      id={meta.icon}
                      boxSize={24}
                      size={14}
                      className="mb-0"
                    />
                    <Text className={`text-xs ${textMuted(isDark)}`}>
                      {meta.label}
                      {isRitualFilEntry(entry) ? " · fiche complète" : ""}
                    </Text>
                  </View>
                </View>
                <Text className={`font-medium text-base mb-1 ${textPrimary(isDark)}`}>
                  {entry.summary}
                </Text>
                {preview ? (
                  <Text
                    className={`text-sm leading-6 ${textSecondary(isDark)}`}
                    numberOfLines={3}
                  >
                    {preview}
                    {preview.length >= 120 ? "…" : ""}
                  </Text>
                ) : null}
                {entry.metadata?.colors?.length ? (
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {entry.metadata.colors.slice(0, 6).map((hex) => (
                      <View
                        key={hex}
                        className={`w-6 h-6 rounded-full border ${isDark ? "border-sand-600" : "border-sand-200"}`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </View>
                ) : null}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    void handleDeleteEntry(entry);
                  }}
                  hitSlop={8}
                  className="mt-3 self-end"
                >
                  <Text className={`text-xs ${textMuted(isDark)}`}>
                    Retirer du Fil
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}

          <View className={`gap-3 pt-6 mt-2 border-t ${isDark ? "border-sand-700" : "border-sand-200"}`}>
            <PrimaryButton
              label="Préparer un exercice"
              onPress={() => router.push("/ritual")}
            />
            <Text className={`text-xs text-center leading-5 px-2 ${textMuted(isDark)}`}>
              Pour retirer une trace, ouvrez-la ou utilisez « Retirer du Fil » sur
              la carte. L&apos;effacement complet demande une double confirmation.
            </Text>
            <PrimaryButton
              label="Effacer tout le Fil…"
              onPress={() => void handleClear()}
              variant="ghost"
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
