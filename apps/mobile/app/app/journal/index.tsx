import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { InlineNotice } from "@/components/InlineNotice";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import {
  createSessionLogId,
  getSessionLogs,
  saveSessionLog,
} from "@/lib/sessionLog/storage";
import type { DeepSessionLog } from "@/lib/experience/types";
import type { FilEntry } from "@/lib/fil/types";
import { getFilEntries } from "@/lib/fil/storage";
import {
  backupLocalDataToGoogleDrive,
  getGoogleDriveConnectionStatus,
} from "@/lib/storage/googleDriveAdapter";
import { showAlert } from "@/lib/alert";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

function logPreview(log: DeepSessionLog): string {
  const manual = log.privateNotes?.trim();
  if (manual) return manual;
  const text =
    log.sessionData?.round2?.aiAnalysis ??
    log.sessionData?.round1?.aiAnalysis ??
    log.aiReflection?.reflection ??
    log.exercise.exercise;
  return text.replace(/\s+/g, " ").trim();
}

function isManualEntry(log: DeepSessionLog): boolean {
  return Boolean(log.privateNotes?.trim()) && !log.sessionData?.round1?.aiAnalysis;
}

export default function JournalScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation(["journal", "fil"]);
  const [logs, setLogs] = useState<DeepSessionLog[]>([]);
  const [filEntries, setFilEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [privateNotes, setPrivateNotes] = useState("");
  const [privatePhotoUris, setPrivatePhotoUris] = useState<string[]>([]);
  const [linkedFilEntryIds, setLinkedFilEntryIds] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [nextLogs, nextFil, drive] = await Promise.all([
      getSessionLogs(),
      getFilEntries(),
      getGoogleDriveConnectionStatus().catch(() => ({
        connected: false,
        configured: false,
        meta: null,
      })),
    ]);
    setLogs(nextLogs);
    setFilEntries(nextFil.slice(0, 12));
    setDriveConnected(drive.connected);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const sorted = useMemo(
    () => [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [logs]
  );

  const canSaveNote =
    privateNotes.trim().length >= 2 ||
    privatePhotoUris.length > 0 ||
    linkedFilEntryIds.length > 0;

  async function handlePickPrivatePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(t("journal:photoPermissionTitle"), t("journal:photoPermissionBody"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    if (result.canceled) return;
    const uris = result.assets
      .map((asset) => asset.uri)
      .filter((uri): uri is string => typeof uri === "string" && uri.length > 0);
    setPrivatePhotoUris((prev) =>
      Array.from(new Set([...prev, ...uris])).slice(0, 4)
    );
  }

  function removePrivatePhoto(uri: string) {
    setPrivatePhotoUris((prev) => prev.filter((x) => x !== uri));
  }

  function toggleFilLink(id: string) {
    setLinkedFilEntryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSavePrivateNote() {
    if (!canSaveNote || savingNote) return;
    setSavingNote(true);
    try {
      const noteId = createSessionLogId();
      await saveSessionLog({
        id: noteId,
        createdAt: new Date().toISOString(),
        mode: "express",
        exercise: {
          impulse:
            privateNotes.trim().slice(0, 48) || t("journal:manualEntryTitle"),
          technique: "writing",
          techniqueLabel: t("journal:manualEntryTechnique"),
          exercise: t("journal:manualEntryExercise"),
          durationMinutes: 15,
        },
        postIntegration: {
          resonance: privateNotes.trim(),
          intention: "",
          keeper: "",
        },
        hasPhoto: privatePhotoUris.length > 0,
        privateNotes: privateNotes.trim(),
        privatePhotoUris,
        linkedFilEntryIds,
      });
      setPrivateNotes("");
      setPrivatePhotoUris([]);
      setLinkedFilEntryIds([]);
      setNotice(t("journal:savedNotice"));
      await load();
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDriveSync() {
    if (!driveConnected || syncingDrive) return;
    setSyncingDrive(true);
    try {
      await backupLocalDataToGoogleDrive();
      setNotice(t("journal:driveSyncDone"));
    } catch (error) {
      showAlert(
        t("journal:driveSyncTitle"),
        error instanceof Error ? error.message : t("journal:driveSyncFailed")
      );
    } finally {
      setSyncingDrive(false);
    }
  }

  return (
    <ScreenContainer refreshable onRefresh={load}>
      <ScreenNavBar onBack={() => router.back()} />
      <PastekScreenHero
        label={t("hero.label")}
        title={t("hero.title")}
        accent={t("hero.accent")}
        description={t("hero.description")}
        size="md"
      />

      {notice ? (
        <InlineNotice
          type="success"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      <View className="flex-row gap-3 mb-3">
        <Pressable
          onPress={() => router.push(ROUTES.fil)}
          accessibilityRole="button"
          className={`flex-1 rounded-2xl border px-4 py-4 active:opacity-80 ${panelBg(isDark)}`}
        >
          <Text className="text-sage-600 text-xs uppercase tracking-wider mb-1">
            {t("journal:filBadge")}
          </Text>
          <Text className={`text-xs leading-5 ${textSecondary(isDark)}`}>
            {t("journal:filHint")}
          </Text>
        </Pressable>
        <View
          className={`flex-1 rounded-2xl border px-4 py-4 ${
            isDark ? "border-sage-700 bg-sage-900/40" : "border-sage-200 bg-sage-50/80"
          }`}
        >
          <Text className="text-sage-600 text-xs uppercase tracking-wider mb-1">
            {t("journal:journalBadge")}
          </Text>
          <Text className={`text-xs leading-5 ${textSecondary(isDark)}`}>
            {t("journal:journalHint")}
          </Text>
        </View>
      </View>
      <View className="mb-5">
        <PrimaryButton
          label={t("journal:openFil")}
          onPress={() => router.push(ROUTES.fil)}
          variant="ghost"
        />
      </View>

      <Text className={`text-xs uppercase tracking-wider mb-3 ${textMuted(isDark)}`}>
        {t("journal:composeLabel")}
      </Text>
      <View className={`rounded-2xl border px-5 py-5 mb-6 ${panelBg(isDark)}`}>
        <Text className={`text-sm font-medium mb-1 ${textPrimary(isDark)}`}>
          {t("journal:addTitle")}
        </Text>
        <Text className={`text-xs leading-5 mb-3 ${textMuted(isDark)}`}>
          {t("journal:localOnlyHint")}
        </Text>
        <TextInput
          value={privateNotes}
          onChangeText={setPrivateNotes}
          placeholder={t("journal:addPlaceholder")}
          placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
          multiline
          textAlignVertical="top"
          className={`rounded-2xl border px-4 py-3 text-sm min-h-[96px] ${
            isDark
              ? "border-sand-600 bg-sand-800 text-sand-100"
              : "border-sand-200 bg-white text-sand-800"
          }`}
        />
        <View className="mt-3 gap-2">
          <PrimaryButton
            label={
              privatePhotoUris.length
                ? t("journal:addPhotoMore", { count: privatePhotoUris.length })
                : t("journal:addPhoto")
            }
            onPress={() => void handlePickPrivatePhoto()}
            variant="ghost"
          />
          {privatePhotoUris.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {privatePhotoUris.map((uri) => (
                <Pressable
                  key={uri}
                  onPress={() => removePrivatePhoto(uri)}
                  accessibilityLabel={t("journal:removePhoto")}
                >
                  <Image
                    source={{ uri }}
                    className="w-16 h-16 rounded-lg bg-sand-200 border border-sand-300"
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        {filEntries.length > 0 ? (
          <View className="mt-4">
            <Text className={`text-xs mb-1 ${textMuted(isDark)}`}>
              {t("journal:linkFilTitle")}
            </Text>
            <Text className={`text-xs leading-5 mb-2 ${textMuted(isDark)}`}>
              {t("journal:linkFilHint")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {filEntries.map((entry) => {
                const active = linkedFilEntryIds.includes(entry.id);
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => toggleFilLink(entry.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`rounded-full px-3 py-2 border max-w-full ${
                      active
                        ? "bg-sage-100 border-sage-300"
                        : isDark
                          ? "bg-sand-800 border-sand-600"
                          : "bg-white border-sand-200"
                    }`}
                  >
                    <Text
                      className={`text-xs ${active ? "text-sage-800 font-medium" : textSecondary(isDark)}`}
                      numberOfLines={1}
                    >
                      {entry.summary}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        <View className="mt-4 gap-2">
          <PrimaryButton
            label={savingNote ? t("journal:saveBusy") : t("journal:saveLocal")}
            onPress={() => void handleSavePrivateNote()}
            disabled={!canSaveNote || savingNote}
          />
          {driveConnected ? (
            <PrimaryButton
              label={
                syncingDrive ? t("journal:driveSyncBusy") : t("journal:driveSync")
              }
              onPress={() => void handleDriveSync()}
              disabled={syncingDrive}
              variant="secondary"
            />
          ) : (
            <Text className={`text-xs text-center leading-5 px-2 ${textMuted(isDark)}`}>
              {t("journal:driveSyncHint")}
            </Text>
          )}
        </View>
      </View>

      <Text className={`text-xs uppercase tracking-wider mb-3 ${textMuted(isDark)}`}>
        {t("journal:entriesLabel", { count: sorted.length })}
      </Text>

      {loading ? (
        <Text className={`text-sm ${textMuted(isDark)}`}>{t("journal:loading")}</Text>
      ) : sorted.length === 0 ? (
        <View className={`rounded-2xl border px-5 py-6 ${panelBg(isDark)}`}>
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
            {t("empty")}
          </Text>
        </View>
      ) : (
        <View className="gap-3 pb-8">
          {sorted.map((log) => {
            const preview = logPreview(log);
            const manual = isManualEntry(log);
            const linkedCount = log.linkedFilEntryIds?.length ?? 0;
            const photoCount = log.privatePhotoUris?.length ?? 0;
            const hasRound2 = Boolean(log.sessionData?.round2);
            return (
              <Pressable
                key={log.id}
                onPress={() => router.push(ROUTES.journalEntry(log.id))}
                accessibilityRole="button"
                className={`rounded-2xl border px-5 py-4 active:opacity-80 ${panelBg(isDark)}`}
              >
                <View className="flex-row items-center justify-between mb-1 gap-2">
                  <Text
                    className={`flex-1 text-sm font-medium ${textPrimary(isDark)}`}
                    numberOfLines={1}
                  >
                    {log.exercise.impulse}
                  </Text>
                  <Text className={`text-xs shrink-0 ${textMuted(isDark)}`}>
                    {formatSessionDate(log.createdAt)}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {manual ? (
                    <Text className="text-[10px] uppercase tracking-wider text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full">
                      {t("journal:badgeNote")}
                    </Text>
                  ) : (
                    <Text className={`text-xs ${textMuted(isDark)}`}>
                      {localizedTechniqueLabel(log.exercise.technique)} ·{" "}
                      {log.mode === "deep" ? t("modeDeep") : t("modeExpress")}
                      {hasRound2 ? ` · ${t("round2")}` : ""}
                    </Text>
                  )}
                  {linkedCount > 0 ? (
                    <Text className="text-[10px] uppercase tracking-wider text-sand-600 bg-sand-100 px-2 py-0.5 rounded-full">
                      {t("journal:badgeFil", { count: linkedCount })}
                    </Text>
                  ) : null}
                  {photoCount > 0 ? (
                    <Text className="text-[10px] uppercase tracking-wider text-sand-600 bg-sand-100 px-2 py-0.5 rounded-full">
                      {t("journal:badgePhotos", { count: photoCount })}
                    </Text>
                  ) : null}
                </View>
                {preview ? (
                  <Text
                    className={`text-sm leading-5 ${textSecondary(isDark)}`}
                    numberOfLines={3}
                  >
                    {preview}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
