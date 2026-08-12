import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { FilConversionCTA } from "@/components/fil/FilConversionCTA";
import { PastekIcon } from "@/components/ui/ModuleIcon";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ProgressiveReflection } from "@/components/reflection/ProgressiveReflection";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
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
import { analyzeFilSelection, ApiError } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { getGoogleDriveConnectionStatus } from "@/lib/storage/googleDriveAdapter";

const FILTER_SOURCES: Array<{ id: FilSource | "all"; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "ritual", label: "Rituel" },
  { id: "ping-pong", label: "Ping-Pong" },
  { id: "color-journey", label: "Palette" },
  { id: "emotion-explorer", label: "Émotions" },
  { id: "nuances", label: "Nuances" },
];

const MAX_FIL_ANALYSIS = 5;

export default function FilScreen() {
  const isDark = useIsDark();
  const [entries, setEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<FilSource | "all">("all");
  const [showDriveCta, setShowDriveCta] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setEntries(await getFilEntries());
    setLoading(false);
    try {
      const status = await getGoogleDriveConnectionStatus();
      setShowDriveCta(!status.connected);
    } catch {
      setShowDriveCta(true);
    }
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
    setSelectedIds([]);
    setAnalysisResult(null);
  }

  async function handleDeleteEntry(entry: FilEntry) {
    const confirmed = await confirmDeleteFilEntry(entry.summary);
    if (!confirmed) return;
    await deleteFilEntry(entry.id);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setSelectedIds((prev) => prev.filter((id) => id !== entry.id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_FIL_ANALYSIS) {
        showAlert(
          "Sélection",
          `Vous pouvez analyser au maximum ${MAX_FIL_ANALYSIS} traces.`
        );
        return prev;
      }
      return [...prev, id];
    });
  }

  async function handleAnalyzeSelection() {
    if (selectedIds.length === 0) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const selected = entries.filter((e) => selectedIds.includes(e.id));
      const result = await analyzeFilSelection({
        entries: selected.map((e) => ({
          summary: e.summary,
          detail: e.detail,
          impulse: e.metadata?.impulse,
          technique: e.metadata?.technique
            ? getTechniqueLabel(e.metadata.technique)
            : undefined,
          reflection: e.metadata?.reflection,
          exercise: e.metadata?.exercise,
        })),
      });
      setAnalysisResult(result.reflection);
      if (result.source === "fallback") {
        showAlert(
          "Analyse",
          result.analysisNote ??
            "Analyse en mode secours — vérifiez votre clé IA."
        );
      }
    } catch (error) {
      showAlert(
        "Analyse impossible",
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Réessayez dans un instant."
      );
    } finally {
      setAnalyzing(false);
    }
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
          {showDriveCta ? (
            <View className="mt-6 w-full">
              <FilConversionCTA onPress={() => router.push(ROUTES.premiumCloud)} />
            </View>
          ) : null}
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

          <View className="flex-row gap-2 mb-1">
            <View className="flex-1">
              <PrimaryButton
                label={
                  selectMode
                    ? "Annuler la sélection"
                    : "Analyser le Fil (max 5)"
                }
                onPress={() => {
                  setSelectMode((v) => !v);
                  setSelectedIds([]);
                  setAnalysisResult(null);
                }}
                variant={selectMode ? "ghost" : "secondary"}
              />
            </View>
          </View>

          {selectMode ? (
            <Text className={`text-xs mb-1 ${textMuted(isDark)}`}>
              Sélectionnez jusqu&apos;à {MAX_FIL_ANALYSIS} traces ({selectedIds.length}/
              {MAX_FIL_ANALYSIS}).
            </Text>
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

          {filtered.map((entry, index) => {
            const meta = FIL_SOURCE_META[entry.source];
            const preview =
              entry.metadata?.reflection?.slice(0, 120) ??
              entry.detail?.slice(0, 120);
            const selected = selectedIds.includes(entry.id);
            return (
              <View key={entry.id} className="gap-3">
                <Pressable
                  onPress={() => {
                    if (selectMode) {
                      toggleSelect(entry.id);
                      return;
                    }
                    router.push(ROUTES.filEntry(entry.id));
                  }}
                  className={`rounded-3xl border px-5 py-4 ${panelBg(isDark)} ${
                    selected ? "border-sage-500" : ""
                  }`}
                >
                  {selectMode ? (
                    <Text
                      className={`text-xs font-medium mb-2 ${
                        selected ? "text-sage-600" : textMuted(isDark)
                      }`}
                    >
                      {selected ? "Sélectionnée" : "Toucher pour sélectionner"}
                    </Text>
                  ) : null}
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
                  {!selectMode ? (
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
                  ) : null}
                </Pressable>
                {showDriveCta && index === 0 ? (
                  <FilConversionCTA onPress={() => router.push(ROUTES.premiumCloud)} />
                ) : null}
              </View>
            );
          })}

          {selectMode ? (
            <View className="gap-3 pt-2">
              <PrimaryButton
                label={
                  analyzing
                    ? "Analyse en cours…"
                    : `Analyser ${selectedIds.length || ""} trace${selectedIds.length > 1 ? "s" : ""}`
                }
                onPress={() => void handleAnalyzeSelection()}
                disabled={analyzing || selectedIds.length === 0}
              />
              {analysisResult ? (
                <View
                  className={`rounded-2xl border px-4 py-4 ${panelBg(isDark)}`}
                >
                  <Text
                    className={`text-xs uppercase tracking-wider mb-2 ${textMuted(isDark)}`}
                  >
                    Lecture croisée
                  </Text>
                  <ProgressiveReflection reflection={analysisResult} />
                </View>
              ) : null}
            </View>
          ) : null}

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
