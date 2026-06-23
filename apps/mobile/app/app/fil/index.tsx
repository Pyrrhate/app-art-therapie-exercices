import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PastekIcon } from "@/components/ui/ModuleIcon";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import {
  clearFilEntries,
  deleteFilEntry,
  FIL_MAX_ENTRIES,
  FIL_NEAR_LIMIT_THRESHOLD,
  getFilEntries,
} from "@/lib/fil/storage";
import {
  confirmClearAllFil,
  confirmDeleteFilEntry,
} from "@/lib/fil/deleteConfirm";
import {
  FIL_SOURCE_META,
  isRitualFilEntry,
  type FilEntry,
  type FilSource,
} from "@/lib/fil/types";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const FILTER_SOURCES: Array<{ id: FilSource | "all"; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "ritual", label: "Rituel" },
  { id: "ping-pong", label: "Ping-Pong" },
  { id: "color-journey", label: "Palette" },
  { id: "emotion-explorer", label: "Émotions" },
  { id: "nuances", label: "Nuances" },
];

export default function FilScreen() {
  const isDark = useIsDark();
  const [entries, setEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<FilSource | "all">("all");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (sourceFilter !== "all" && entry.source !== sourceFilter) return false;
      if (!q) return true;
      const meta = FIL_SOURCE_META[entry.source];
      const haystack = [
        entry.summary,
        entry.detail,
        meta.label,
        entry.metadata?.impulse,
        entry.metadata?.reflection,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, sourceFilter]);

  const nearLimit = entries.length >= FIL_NEAR_LIMIT_THRESHOLD;

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
    <ScreenContainer scrollable refreshable onRefresh={load} compactTop>
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
            <PrimaryButton label="Préparer un exercice" onPress={() => router.push(ROUTES.ritual)} />
            <PrimaryButton label="Retour à l'accueil" onPress={navigateHome} variant="ghost" />
          </View>
        </View>
      ) : (
        <View className="gap-3 pb-6">
          {nearLimit ? (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-1">
              <Text className="text-amber-800 text-sm leading-5">
                {entries.length} / {FIL_MAX_ENTRIES} traces — la plus ancienne sera
                retirée automatiquement au prochain ajout. Exportez votre pratique
                dans les paramètres si vous souhaitez tout conserver.
              </Text>
            </View>
          ) : null}

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une trace…"
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            className={`rounded-2xl border px-4 py-3 text-base mb-2 ${
              isDark
                ? "border-sand-600 bg-sand-800 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />

          <View className="flex-row flex-wrap gap-2 mb-2">
            {FILTER_SOURCES.map((item) => {
              const active = sourceFilter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSourceFilter(item.id)}
                  className={`rounded-full px-3 py-1.5 border ${
                    active
                      ? "bg-sage-500 border-sage-500"
                      : isDark
                        ? "border-sand-600"
                        : "border-sand-200"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      active ? "text-white font-medium" : textMuted(isDark)
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filtered.length === 0 ? (
            <Text className={`text-sm text-center py-6 ${textMuted(isDark)}`}>
              Aucune trace ne correspond à votre recherche.
            </Text>
          ) : null}

          {filtered.map((entry) => {
            const meta = FIL_SOURCE_META[entry.source];
            const preview =
              entry.metadata?.reflection?.slice(0, 120) ??
              entry.detail?.slice(0, 120);
            return (
              <Pressable
                key={entry.id}
                onPress={() => router.push(ROUTES.filEntry(entry.id))}
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
              onPress={() => router.push(ROUTES.ritual)}
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
