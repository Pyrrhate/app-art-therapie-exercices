import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { FilConversionCTA } from "@/components/fil/FilConversionCTA";
import { FilMasonry } from "@/components/fil/FilMasonry";
import { FilTagChip } from "@/components/fil/FilTagChip";
import { InlineNotice } from "@/components/InlineNotice";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ProgressiveReflection } from "@/components/reflection/ProgressiveReflection";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import {
  addFilEntry,
  clearFilEntries,
  FIL_MAX_ENTRIES,
  FIL_NEAR_LIMIT_THRESHOLD,
  getFilEntries,
} from "@/lib/fil/storage";
import { confirmClearAllFil } from "@/lib/fil/deleteConfirm";
import { collectFilterTags, entryMatchesTag } from "@/lib/fil/tags";
import { getFilSourceLabel, type FilEntry } from "@/lib/fil/types";
import { persistJournalPhotos } from "@/lib/journalPhotos";
import { analyzeFilSelection, ApiError } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { getGoogleDriveConnectionStatus } from "@/lib/storage/googleDriveAdapter";

const MAX_FIL_ANALYSIS = 5;

export default function FilScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("fil");
  const [entries, setEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [showDriveCta, setShowDriveCta] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notePhotos, setNotePhotos] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const availableTags = useMemo(() => collectFilterTags(entries), [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (tagFilter !== "all" && !entryMatchesTag(entry, tagFilter)) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        entry.summary,
        entry.detail,
        getFilSourceLabel(entry.source, t),
        entry.metadata?.impulse,
        entry.metadata?.reflection,
        entry.metadata?.privateNotes,
        ...(entry.tags ?? []),
        entry.metadata?.techniqueLabel,
        entry.metadata?.seasonTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, tagFilter, t]);

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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_FIL_ANALYSIS) {
        showAlert(
          t("alerts.selectionTitle"),
          t("alerts.selectionMax", { max: MAX_FIL_ANALYSIS })
        );
        return prev;
      }
      return [...prev, id];
    });
  }

  function handlePressEntry(entry: FilEntry) {
    if (selectMode) {
      toggleSelect(entry.id);
      return;
    }
    router.push(ROUTES.filEntry(entry.id));
  }

  async function handlePickNotePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(t("list.photoPermissionTitle"), t("list.photoPermissionBody"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    if (result.canceled) return;
    const picked = result.assets
      .map((asset) => asset.uri)
      .filter((uri): uri is string => typeof uri === "string" && uri.length > 0);
    const uris = await persistJournalPhotos(picked);
    setNotePhotos((prev) => Array.from(new Set([...prev, ...uris])).slice(0, 6));
  }

  async function handleSaveNote() {
    const notes = noteText.trim();
    if ((!notes && notePhotos.length === 0) || savingNote) return;
    setSavingNote(true);
    try {
      const photos = await persistJournalPhotos(notePhotos);
      await addFilEntry({
        source: "note",
        summary: notes.slice(0, 48) || t("source.note"),
        detail: notes,
        metadata: {
          technique: "writing",
          techniqueLabel: t("source.note"),
          privateNotes: notes,
          privatePhotoUris: photos,
          photoUri: photos[0],
        },
      });
      setNoteText("");
      setNotePhotos([]);
      setNotice(t("list.savedNotice"));
      await load();
    } catch (error) {
      showAlert(
        t("list.composeSave"),
        error instanceof Error ? error.message : t("alerts.retry")
      );
    } finally {
      setSavingNote(false);
    }
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
            ? localizedTechniqueLabel(e.metadata.technique)
            : undefined,
          reflection: e.metadata?.reflection,
          exercise: e.metadata?.exercise,
        })),
      });
      setAnalysisResult(result.reflection);
      if (result.source === "fallback") {
        showAlert(
          t("alerts.analysisTitle"),
          result.analysisNote ?? t("alerts.analysisFallback")
        );
      }
    } catch (error) {
      showAlert(
        t("alerts.analysisFailedTitle"),
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("alerts.retry")
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={load} compactTop>
      <ScreenNavBar backLabel={t("nav.backHome")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("list.heroLabel")}
        title={t("list.heroTitle")}
        accent={t("list.heroAccent")}
        description={t("list.heroDescription")}
        className="mb-6"
      />

      {notice ? (
        <InlineNotice
          type="success"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      <View className={`rounded-2xl border px-5 py-5 mb-6 ${panelBg(isDark)}`}>
        <Text className={`text-xs uppercase tracking-wider mb-2 ${textMuted(isDark)}`}>
          {t("list.composeLabel")}
        </Text>
        <TextInput
          value={noteText}
          onChangeText={setNoteText}
          placeholder={t("list.composePlaceholder")}
          placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
          multiline
          textAlignVertical="top"
          className={`rounded-2xl border px-4 py-3 text-sm min-h-[88px] ${
            isDark
              ? "border-sand-600 bg-sand-800 text-sand-100"
              : "border-sand-200 bg-white text-sand-800"
          }`}
        />
        <View className="mt-3 gap-2">
          <PrimaryButton
            label={
              notePhotos.length
                ? t("list.composePhotoMore", { count: notePhotos.length })
                : t("list.composePhoto")
            }
            onPress={() => void handlePickNotePhoto()}
            variant="ghost"
          />
          {notePhotos.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {notePhotos.map((uri) => (
                <Pressable
                  key={uri}
                  onPress={() =>
                    setNotePhotos((prev) => prev.filter((x) => x !== uri))
                  }
                >
                  <Image
                    source={{ uri }}
                    className="w-16 h-16 rounded-lg bg-sand-200"
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
          <PrimaryButton
            label={savingNote ? t("list.composeBusy") : t("list.composeSave")}
            onPress={() => void handleSaveNote()}
            disabled={savingNote || (!noteText.trim() && notePhotos.length === 0)}
          />
        </View>
      </View>

      {loading ? (
        <Text className={textMuted(isDark)}>{t("list.loading")}</Text>
      ) : entries.length === 0 ? (
        <View
          className={`rounded-3xl border border-dashed px-5 py-10 items-center ${panelBg(isDark)}`}
        >
          <Text className={`text-center leading-6 ${textMuted(isDark)}`}>
            {t("list.empty")}
          </Text>
          {showDriveCta ? (
            <View className="mt-6 w-full">
              <FilConversionCTA onPress={() => router.push(ROUTES.premiumCloud)} />
            </View>
          ) : null}
          <View className="mt-6 w-full gap-3">
            <PrimaryButton
              label={t("list.prepareExercise")}
              onPress={() => router.push(ROUTES.ritual)}
            />
            <PrimaryButton
              label={t("list.backHome")}
              onPress={navigateHome}
              variant="ghost"
            />
          </View>
        </View>
      ) : (
        <View className="gap-3 pb-6">
          {nearLimit ? (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-1">
              <Text className="text-amber-800 text-sm leading-5">
                {t("list.nearLimit", {
                  used: entries.length,
                  max: FIL_MAX_ENTRIES,
                })}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label={
              selectMode
                ? t("list.selectCancel")
                : t("list.selectStart", { max: MAX_FIL_ANALYSIS })
            }
            onPress={() => {
              setSelectMode((v) => !v);
              setSelectedIds([]);
              setAnalysisResult(null);
            }}
            variant={selectMode ? "ghost" : "secondary"}
          />

          {selectMode ? (
            <Text className={`text-xs mb-1 ${textMuted(isDark)}`}>
              {t("list.selectHint", {
                max: MAX_FIL_ANALYSIS,
                used: selectedIds.length,
              })}
            </Text>
          ) : null}

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("list.searchPlaceholder")}
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "border-sand-600 bg-sand-800 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />

          <View className="flex-row flex-wrap gap-2">
            <FilTagChip
              label={t("list.filterAll")}
              active={tagFilter === "all"}
              onPress={() => setTagFilter("all")}
            />
            {availableTags.map((tag) => (
              <FilTagChip
                key={tag}
                label={tag}
                active={tagFilter === tag}
                onPress={() =>
                  setTagFilter((current) => (current === tag ? "all" : tag))
                }
              />
            ))}
          </View>

          {filtered.length === 0 ? (
            <Text className={`text-sm text-center py-6 ${textMuted(isDark)}`}>
              {t("list.noMatch")}
            </Text>
          ) : (
            <>
              {showDriveCta ? (
                <FilConversionCTA
                  onPress={() => router.push(ROUTES.premiumCloud)}
                />
              ) : null}
              <FilMasonry
                entries={filtered}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onPressEntry={handlePressEntry}
              />
            </>
          )}

          {selectMode ? (
            <View className="gap-3 pt-2">
              <PrimaryButton
                label={
                  analyzing
                    ? t("list.analyzeBusy")
                    : t("list.analyze", { count: selectedIds.length })
                }
                onPress={() => void handleAnalyzeSelection()}
                disabled={analyzing || selectedIds.length === 0}
              />
              {analysisResult ? (
                <View className={`rounded-2xl border px-4 py-4 ${panelBg(isDark)}`}>
                  <Text
                    className={`text-xs uppercase tracking-wider mb-2 ${textMuted(isDark)}`}
                  >
                    {t("list.crossReading")}
                  </Text>
                  <ProgressiveReflection reflection={analysisResult} />
                </View>
              ) : null}
            </View>
          ) : null}

          <View
            className={`gap-3 pt-6 mt-2 border-t ${
              isDark ? "border-sand-700" : "border-sand-200"
            }`}
          >
            <PrimaryButton
              label={t("list.prepareExercise")}
              onPress={() => router.push(ROUTES.ritual)}
            />
            <PrimaryButton
              label={t("list.clearAll")}
              onPress={() => void handleClear()}
              variant="ghost"
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
