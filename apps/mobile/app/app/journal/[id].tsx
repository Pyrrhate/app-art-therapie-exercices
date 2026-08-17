import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ProgressiveReflection } from "@/components/reflection/ProgressiveReflection";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate } from "@/constants";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { deleteSessionLog, getSessionLogById } from "@/lib/sessionLog/storage";
import { confirmDeleteJournalEntry } from "@/lib/sessionLog/deleteConfirm";
import type { DeepSessionLog } from "@/lib/experience/types";
import type { FilEntry } from "@/lib/fil/types";
import { getFilEntryById } from "@/lib/fil/storage";
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

export default function JournalDetailScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation(["journal", "ritual"]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<DeepSessionLog | null>(null);
  const [linkedFilEntries, setLinkedFilEntries] = useState<FilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
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

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <ScreenContainer>
      <ScreenNavBar onBack={() => router.back()} />
      <PastekScreenHero
        label={log.mode === "deep" ? t("journal:modeDeep") : t("journal:modeExpress")}
        title={log.exercise.impulse}
        description={`${formatSessionDate(log.createdAt)} · ${localizedTechniqueLabel(log.exercise.technique)} · ${log.exercise.durationMinutes} min`}
        size="md"
      />

      {(log.privateNotes?.trim() ||
        (log.privatePhotoUris?.length ?? 0) > 0 ||
        linkedFilEntries.length > 0) && (
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

      {round1?.media ? (
        <Image
          source={{ uri: round1.media }}
          className="w-full h-56 rounded-2xl mb-4 bg-sand-200"
          resizeMode="cover"
        />
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
          {round2.media ? (
            <Image
              source={{ uri: round2.media }}
              className="w-full h-48 rounded-xl mb-4 bg-sand-200"
              resizeMode="cover"
            />
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

      {log.postIntegration.resonance || log.postIntegration.intention ? (
        <Section title={t("journal:integration")} isDark={isDark}>
          {log.postIntegration.resonance ? (
            <Text className={`text-sm leading-6 mb-3 ${textSecondary(isDark)}`}>
              {log.postIntegration.resonance}
            </Text>
          ) : null}
          {log.postIntegration.intention ? (
            <Text className={`text-sm leading-6 mb-3 ${textSecondary(isDark)}`}>
              {log.postIntegration.intention}
            </Text>
          ) : null}
          {log.postIntegration.keeper ? (
            <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
              {log.postIntegration.keeper}
            </Text>
          ) : null}
        </Section>
      ) : null}

      {log.privateNotes?.trim() ? (
        <Section title={t("journal:privateNotes")} isDark={isDark}>
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
            {log.privateNotes}
          </Text>
        </Section>
      ) : null}

      {log.privatePhotoUris?.length ? (
        <Section title={t("journal:privatePhotos")} isDark={isDark}>
          <View className="flex-row flex-wrap gap-3">
            {log.privatePhotoUris.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                className="w-24 h-24 rounded-xl bg-sand-200"
              />
            ))}
          </View>
        </Section>
      ) : null}

      {linkedFilEntries.length > 0 ? (
        <Section title={t("journal:linkedFil")} isDark={isDark}>
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
        </Section>
      ) : null}

      <View className="gap-3 pb-8">
        <PrimaryButton
          label={exporting ? t("journal:exportBusy") : t("journal:exportPdf")}
          onPress={() => void handleExportPdf()}
          disabled={exporting}
          variant="secondary"
        />
        <PrimaryButton
          label={t("journal:delete")}
          onPress={() => void handleDelete()}
          variant="ghost"
        />
      </View>
    </ScreenContainer>
  );
}
