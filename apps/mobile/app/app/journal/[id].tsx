import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { ProgressiveReflection } from "@/components/reflection/ProgressiveReflection";
import { ImageLightbox, isRenderableImageUri } from "@/components/journal/ImageLightbox";
import { EinkEditor } from "@/components/journal/EinkEditor";
import { InlineNotice } from "@/components/InlineNotice";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import {
  deleteSessionLog,
  getSessionLogById,
  patchSessionLog,
} from "@/lib/sessionLog/storage";
import { confirmDeleteJournalEntry } from "@/lib/sessionLog/deleteConfirm";
import type { DeepSessionLog } from "@/lib/experience/types";
import type { FilEntry } from "@/lib/fil/types";
import { getFilEntries, getFilEntryById } from "@/lib/fil/storage";
import { showAlert } from "@/lib/alert";
import { exportSessionPdf } from "@/lib/sessionExport";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

function Section({
  title,
  children,
  isDark,
}: {
  title: string;
  children: ReactNode;
  isDark: boolean;
}) {
  return (
    <View className={`rounded-2xl border px-5 py-5 mb-4 ${panelBg(isDark)}`}>
      <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
        {title}
      </Text>
      {children}
    </View>
  );
}

function collectImageUris(log: DeepSessionLog): string[] {
  const uris: string[] = [];
  if (isRenderableImageUri(log.sessionData?.round1?.media)) {
    uris.push(log.sessionData.round1.media);
  }
  if (isRenderableImageUri(log.sessionData?.round2?.media)) {
    uris.push(log.sessionData.round2.media);
  }
  for (const uri of log.privatePhotoUris ?? []) {
    if (isRenderableImageUri(uri) && !uris.includes(uri)) uris.push(uri);
  }
  return uris;
}

export default function JournalDetailScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation(["journal", "ritual"]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<DeepSessionLog | null>(null);
  const [linkedFilEntries, setLinkedFilEntries] = useState<FilEntry[]>([]);
  const [filEntries, setFilEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftPhotos, setDraftPhotos] = useState<string[]>([]);
  const [draftLinks, setDraftLinks] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const nextLog = await getSessionLogById(id);
    setLog(nextLog);
    if (nextLog?.linkedFilEntryIds?.length) {
      const linked = await Promise.all(
        nextLog.linkedFilEntryIds.map((entryId) => getFilEntryById(entryId))
      );
      setLinkedFilEntries(linked.filter((entry): entry is FilEntry => Boolean(entry)));
    } else {
      setLinkedFilEntries([]);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const imageUris = useMemo(() => {
    if (!log) return [];
    if (editing) {
      const sessionUris = collectImageUris({ ...log, privatePhotoUris: [] });
      const privateUris = draftPhotos.filter(isRenderableImageUri);
      return Array.from(new Set([...sessionUris, ...privateUris]));
    }
    return collectImageUris(log);
  }, [log, editing, draftPhotos]);

  const filPickerEntries = useMemo(() => {
    const byId = new Map<string, FilEntry>();
    for (const entry of filEntries) byId.set(entry.id, entry);
    for (const entry of linkedFilEntries) byId.set(entry.id, entry);
    return Array.from(byId.values());
  }, [filEntries, linkedFilEntries]);

  function openPhoto(uri: string) {
    const index = imageUris.indexOf(uri);
    setViewerIndex(index >= 0 ? index : 0);
  }

  function startEdit() {
    if (!log) return;
    setDraftTitle(log.exercise.impulse);
    setDraftNotes(log.privateNotes ?? "");
    setDraftPhotos(log.privatePhotoUris ?? []);
    setDraftLinks(log.linkedFilEntryIds ?? []);
    setEditing(true);
    void getFilEntries().then((entries) => setFilEntries(entries.slice(0, 24)));
  }

  function cancelEdit() {
    setEditing(false);
  }

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
    setDraftPhotos((prev) => Array.from(new Set([...prev, ...uris])).slice(0, 4));
  }

  function toggleFilLink(entryId: string) {
    setDraftLinks((prev) =>
      prev.includes(entryId) ? prev.filter((x) => x !== entryId) : [...prev, entryId]
    );
  }

  async function handleSaveEdit() {
    if (!log || saving) return;
    setSaving(true);
    try {
      const notes = draftNotes.trim();
      const photos = draftPhotos.filter(isRenderableImageUri);
      const round1Media = log.sessionData?.round1?.media;
      const round2Media = log.sessionData?.round2?.media;
      const updated = await patchSessionLog(log.id, {
        privateNotes: notes,
        privatePhotoUris: photos,
        linkedFilEntryIds: draftLinks,
        exercise: {
          ...log.exercise,
          impulse: draftTitle.trim() || log.exercise.impulse,
        },
        postIntegration: !log.sessionData?.round1?.aiAnalysis
          ? { ...log.postIntegration, resonance: notes }
          : log.postIntegration,
        hasPhoto:
          photos.length > 0 ||
          isRenderableImageUri(round1Media) ||
          isRenderableImageUri(round2Media),
      });
      if (updated) {
        setLog(updated);
        if (updated.linkedFilEntryIds?.length) {
          const linked = await Promise.all(
            updated.linkedFilEntryIds.map((entryId) => getFilEntryById(entryId))
          );
          setLinkedFilEntries(
            linked.filter((entry): entry is FilEntry => Boolean(entry))
          );
        } else {
          setLinkedFilEntries([]);
        }
      }
      setEditing(false);
      setNotice(t("journal:updatedNotice"));
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPdf() {
    if (!log) return;
    setExporting(true);
    try {
      const round2 = log.sessionData?.round2;
      const round1 = log.sessionData?.round1;
      const reflection =
        round2?.aiAnalysis ?? round1?.aiAnalysis ?? log.aiReflection?.reflection;
      const photoUri = round2?.media || round1?.media || undefined;
      const result = await exportSessionPdf({
        id: log.id,
        impulse: log.exercise.impulse,
        technique: log.exercise.technique,
        exercise: log.exercise.exercise,
        durationMinutes: log.exercise.durationMinutes,
        photoUri: photoUri || undefined,
        reflection: reflection ?? undefined,
        openQuestions: round2?.openQuestions ?? round1?.openQuestions,
        writtenText: round2?.writtenText ?? round1?.writtenText ?? log.writtenText,
        createdAt: log.createdAt,
      });
      showAlert(t("ritual:reflection.notice.exportPdfTitle"), result.message);
    } catch (error) {
      showAlert(
        t("ritual:reflection.notice.exportPdfTitle"),
        error instanceof Error
          ? error.message
          : t("ritual:reflection.notice.exportFailed")
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!log) return;
    const confirmed = await confirmDeleteJournalEntry();
    if (!confirmed) return;
    await deleteSessionLog(log.id);
    router.back();
  }

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color="#6B8F71" />
      </ScreenContainer>
    );
  }

  if (!log) {
    return (
      <ScreenContainer>
        <ScreenNavBar onBack={() => router.back()} />
        <Text className={`text-sm ${textSecondary(isDark)}`}>…</Text>
      </ScreenContainer>
    );
  }

  const round1 = log.sessionData?.round1;
  const round2 = log.sessionData?.round2;
  const round1Uri = isRenderableImageUri(round1?.media) ? round1.media : null;
  const round2Uri = isRenderableImageUri(round2?.media) ? round2.media : null;
  const displayPhotos = editing ? draftPhotos : log.privatePhotoUris ?? [];
  const displayLinks = editing ? draftLinks : log.linkedFilEntryIds ?? [];
  return (
    <ScreenContainer>
      <ScreenNavBar
        onBack={() => {
          if (editing) {
            cancelEdit();
            return;
          }
          router.back();
        }}
      />
      <PastekScreenHero
        label={log.mode === "deep" ? t("journal:modeDeep") : t("journal:modeExpress")}
        title={editing ? draftTitle || log.exercise.impulse : log.exercise.impulse}
        description={`${formatSessionDate(log.createdAt)} · ${localizedTechniqueLabel(log.exercise.technique)} · ${log.exercise.durationMinutes} min`}
        size="md"
      />

      {notice ? (
        <InlineNotice
          type="success"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      {(log.privateNotes?.trim() ||
        (log.privatePhotoUris?.length ?? 0) > 0 ||
        linkedFilEntries.length > 0 ||
        editing) && (
        <View
          className={`rounded-2xl border px-4 py-3 mb-4 ${
            isDark ? "border-sage-700 bg-sage-900/40" : "border-sage-200 bg-sage-50/80"
          }`}
        >
          <Text className={`text-xs leading-5 text-center ${textSecondary(isDark)}`}>
            {t("journal:localOnlyHint")}
          </Text>
        </View>
      )}

      {editing ? (
        <Section title={t("journal:editTitle")} isDark={isDark}>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder={t("journal:editTitlePlaceholder")}
            placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
            className={inputClass}
          />
        </Section>
      ) : null}

      {round1Uri ? (
        <Pressable
          onPress={() => openPhoto(round1Uri)}
          accessibilityRole="imagebutton"
          accessibilityLabel={t("journal:viewPhoto")}
          className="mb-4"
        >
          <Image
            source={{ uri: round1Uri }}
            className="w-full rounded-2xl bg-sand-200"
            style={{ aspectRatio: 4 / 3 }}
            resizeMode="contain"
          />
        </Pressable>
      ) : null}

      {round1?.aiAnalysis ? (
        <Section title={t("journal:round1")} isDark={isDark}>
          <ProgressiveReflection reflection={round1.aiAnalysis} />
          {round1.writtenText ? (
            <Text className={`text-sm leading-6 mt-4 ${textSecondary(isDark)}`}>
              {round1.writtenText}
            </Text>
          ) : null}
        </Section>
      ) : null}

      {round2 ? (
        <Section title={t("journal:round2")} isDark={isDark}>
          {round2Uri ? (
            <Pressable
              onPress={() => openPhoto(round2Uri)}
              accessibilityRole="imagebutton"
              accessibilityLabel={t("journal:viewPhoto")}
              className="mb-4"
            >
              <Image
                source={{ uri: round2Uri }}
                className="w-full rounded-xl bg-sand-200"
                style={{ aspectRatio: 4 / 3 }}
                resizeMode="contain"
              />
            </Pressable>
          ) : null}
          <View className="gap-2 mb-4">
            <Text className={`text-xs font-medium ${textPrimary(isDark)}`}>
              {t("journal:transitionAnswers")}
            </Text>
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              {round2.transitionAnswers.gestureChange}
            </Text>
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              {round2.transitionAnswers.newIntention}
            </Text>
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              {round2.transitionAnswers.physicalState}
            </Text>
          </View>
          <ProgressiveReflection reflection={round2.aiAnalysis} />
          {round2.writtenText ? (
            <Text className={`text-sm leading-6 mt-4 ${textSecondary(isDark)}`}>
              {round2.writtenText}
            </Text>
          ) : null}
        </Section>
      ) : null}

      {editing || log.privateNotes?.trim() ? (
        <Section title={t("journal:privateNotes")} isDark={isDark}>
          {editing ? (
            <EinkEditor
              value={draftNotes}
              onChangeText={setDraftNotes}
              placeholder={t("journal:addPlaceholder")}
            />
          ) : (
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              {log.privateNotes}
            </Text>
          )}
        </Section>
      ) : null}

      {editing || displayPhotos.length > 0 ? (
        <Section title={t("journal:privatePhotos")} isDark={isDark}>
          {editing ? (
            <View className="mb-3">
              <PrimaryButton
                label={
                  displayPhotos.length
                    ? t("journal:addPhotoMore", { count: displayPhotos.length })
                    : t("journal:addPhoto")
                }
                onPress={() => void handlePickPrivatePhoto()}
                variant="ghost"
              />
            </View>
          ) : null}
          <View className="gap-3">
            {displayPhotos.map((uri) => (
              <View key={uri} className="relative">
                <Pressable
                  onPress={() => openPhoto(uri)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t("journal:viewPhoto")}
                >
                  <Image
                    source={{ uri }}
                    className="w-full rounded-xl bg-sand-200"
                    style={{ aspectRatio: 4 / 3 }}
                    resizeMode="contain"
                  />
                </Pressable>
                {editing ? (
                  <Pressable
                    onPress={() =>
                      setDraftPhotos((prev) => prev.filter((x) => x !== uri))
                    }
                    accessibilityRole="button"
                    accessibilityLabel={t("journal:removePhoto")}
                    className="absolute top-2 right-2 rounded-full bg-black/55 px-3 py-1.5"
                  >
                    <Text className="text-white text-xs">{t("journal:removePhoto")}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {editing || displayLinks.length > 0 ? (
        <Section title={t("journal:linkedFil")} isDark={isDark}>
          {editing ? (
            <View>
              <Text className={`text-xs leading-5 mb-2 ${textMuted(isDark)}`}>
                {t("journal:linkFilHint")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {filPickerEntries.map((entry) => {
                  const active = draftLinks.includes(entry.id);
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
          ) : (
            <View className="gap-2">
              {linkedFilEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push(ROUTES.filEntry(entry.id))}
                  className={`rounded-xl border px-3 py-2 ${
                    isDark ? "border-sand-600 bg-sand-800" : "border-sand-200 bg-white"
                  }`}
                >
                  <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
                    {entry.summary}
                  </Text>
                  {entry.detail ? (
                    <Text className={`text-xs mt-1 ${textMuted(isDark)}`} numberOfLines={2}>
                      {entry.detail}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </Section>
      ) : null}

      <View className="gap-3 pb-8">
        {editing ? (
          <>
            <PrimaryButton
              label={saving ? t("journal:saveEditBusy") : t("journal:saveEdit")}
              onPress={() => void handleSaveEdit()}
              disabled={saving}
            />
            <PrimaryButton
              label={t("journal:cancelEdit")}
              onPress={cancelEdit}
              variant="ghost"
              disabled={saving}
            />
          </>
        ) : (
          <>
            <PrimaryButton
              label={t("journal:edit")}
              onPress={startEdit}
              variant="secondary"
            />
            <PrimaryButton
              label={exporting ? t("journal:exportBusy") : t("journal:exportPdf")}
              onPress={() => void handleExportPdf()}
              disabled={exporting}
              variant="ghost"
            />
            <PrimaryButton
              label={t("journal:delete")}
              onPress={() => void handleDelete()}
              variant="ghost"
            />
          </>
        )}
      </View>

      <ImageLightbox
        uris={imageUris}
        index={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />
    </ScreenContainer>
  );
}
