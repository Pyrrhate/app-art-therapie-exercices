import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { InlineNotice } from "@/components/InlineNotice";
import { ZenWaitIndicator } from "@/components/ZenWaitIndicator";
import { ProgressiveReflection } from "@/components/reflection/ProgressiveReflection";
import { ReflectionOpenQuestions } from "@/components/reflection/ReflectionOpenQuestions";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import {
  DeepModeGatewayPrompt,
  IntegrationQuestionnaireStep,
  integrationAnswersComplete,
  SecondRoundTransitionStep,
  WorkflowStepTransition,
} from "@/components/experience";
import {
  ContextQuestionnaireStep,
  preAnswersComplete,
} from "@/components/multimodal/ContextQuestionnaireStep";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { RitualProgressBar } from "@/components/ui/RitualProgressBar";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { analyzeArtwork, ApiError, generateAugmentedExercise, transcribeHandwriting } from "@/lib/api";
import { resolveByokCredentials } from "@/lib/aiKeys";
import { exportSessionPdf } from "@/lib/sessionExport";
import { showAlert } from "@/lib/alert";
import { getFilEntries, getFilEntryById, patchFilEntry } from "@/lib/fil/storage";
import {
  buildPracticeContextFromFil,
  countUsableFilTraces,
  PRACTICE_CONTEXT_MAX_ENTRIES,
  PRACTICE_CONTEXT_MAX_ENTRIES_COMPACT,
} from "@/lib/fil/practiceContext";
import {
  composeReflectionWithDeepen,
  resolveOpenQuestionsForPersist,
} from "@/lib/reflection/persist";
import {
  extractImageFileFromDataTransfer,
  formatImageSize,
  getImageByteSize,
  getImagePickerOptions,
  ImageCloudFileError,
  ImageCompressionError,
  ImageProcessingAbortedError,
  ImageReadTimeoutError,
  ImageSourceTooLargeError,
  ImageTooLargeError,
  maxSourceLabel,
  pickImageFileWeb,
  prepareImageDataUrl,
  prepareImageForAnalysis,
  prepareImageFromAsset,
  prepareImageFromFile,
  processTimeoutMs,
  uploadMaxLabel,
  uriToDataUrl,
} from "@/lib/image";
import { recordFilEntry } from "@/lib/fil/record";
import { useRitualStore } from "@/lib/store";
import { getTechniqueLabel, isAiAnalysisSupported } from "@/constants";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { getLocalReflection } from "@/lib/reflection/fallback";
import {
  cleanReflectionBodyForDisplay,
  resolveFollowUpExercise,
  resolveOpenQuestions,
} from "@/lib/reflection/display";
import { mergeWrittenTextWithPreAnalysis } from "@/lib/experience/formatPreAnalysisContext";
import { mergeWrittenTextWithSecondRound } from "@/lib/experience/formatSecondRoundContext";
import { buildRound1Snapshot } from "@/lib/experience/extractEvolutionTriggers";
import { buildAugmentedExerciseRequest } from "@/lib/experience/generateAugmentedExercisePrompt";
import {
  initialReflectionPhase,
  type ReflectionWorkflowPhase,
} from "@/lib/experience/types";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import {
  createSessionLogId,
  saveSessionLog,
  buildSessionDataPayload,
} from "@/lib/sessionLog/storage";
import {
  discardRitualDraft,
  persistRitualDraft,
} from "@/lib/ritualPersistence";
import { getRitualDraft, type ReflectionDraftExtras } from "@/lib/ritualDraft";
import {
  buildDeepenFeedbackContext,
  getReflectionFeedback,
} from "@/lib/feedback/reflectionFeedback";

const DEFAULT_PROCESS_TIMEOUT_MS = 45_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout?: () => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error("TIMEOUT"));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function imageErrorMessage(error: unknown, t: Translate): string {
  if (error instanceof Error && error.message === "TIMEOUT") {
    return t("reflection.notice.photoTimeout");
  }
  if (error instanceof ImageCloudFileError) return error.message;
  if (error instanceof ImageReadTimeoutError) return error.message;
  if (error instanceof ImageSourceTooLargeError) return error.message;
  if (error instanceof ImageTooLargeError) return error.message;
  if (error instanceof ImageCompressionError) return error.message;
  if (error instanceof ImageProcessingAbortedError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return t("reflection.notice.photoFailed");
}

export default function ReflectionScreen() {
  const { t } = useTranslation("ritual");
  const ritual = useRitualStore();
  const {
    impulse,
    technique,
    exercise,
    durationMinutes,
    photoUri,
    reflection,
    openQuestions,
    followUpExercise,
    writtenText,
    experienceMode,
    preAnswers,
    postAnswers,
    currentRound,
    isSecondRoundPrep,
    round1Snapshot,
    transitionAnswers,
    setPhotoUri,
    setWrittenText,
    setReflection,
    setPreAnswers,
    setPostAnswers,
    setExperienceMode,
    setTransitionAnswers,
    beginSecondRound,
    applyAugmentedExercise,
    completeSecondRoundPrep,
    ensureSessionExerciseId,
    startFollowUpExercise,
    reset,
    sessionExerciseId,
    colorContext,
    paletteColors,
  } = ritual;

  const isDeep = experienceMode === "deep";
  const [workflowPhase, setWorkflowPhase] = useState<ReflectionWorkflowPhase>(() =>
    initialReflectionPhase(experienceMode)
  );

  const isWriting = technique === "writing";
  const techniqueNeedsByokForAi = technique
    ? !isAiAnalysisSupported(technique)
    : false;
  const [byokConfigured, setByokConfigured] = useState(false);

  useEffect(() => {
    void resolveByokCredentials()
      .then((c) => setByokConfigured(Boolean(c)))
      .catch(() => setByokConfigured(false));
  }, []);

  useEffect(() => {
    void getFilEntries()
      .then((entries) => {
        const count = countUsableFilTraces(entries);
        setFilTraceCount(count);
        if (count === 0) setUseFilMemory(false);
      })
      .catch(() => {
        setFilTraceCount(0);
        setUseFilMemory(false);
      });
  }, []);

  const supportsAiAnalysis = technique
    ? isAiAnalysisSupported(technique) || byokConfigured
    : true;

  const abortRef = useRef<AbortController | null>(null);
  const workGenRef = useRef(0);
  const filRecordedRef = useRef(false);
  const filEntryIdRef = useRef<string | null>(null);
  const deepenPersistRef = useRef<{
    reflection: string;
    questions: string[];
  }>({ reflection: "", questions: [] });
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSizeLabel, setPhotoSizeLabel] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [reflectionSource, setReflectionSource] = useState<
    "ai" | "fallback" | null
  >(null);
  /** Miroir d'approfondissement — affiché sous le bouton, sans remplacer le premier. */
  const [deepenedReflection, setDeepenedReflection] = useState<string | null>(
    null
  );
  const [deepenedOpenQuestions, setDeepenedOpenQuestions] = useState<string[]>(
    []
  );

  useEffect(() => {
    deepenPersistRef.current = {
      reflection: deepenedReflection?.trim() || "",
      questions: deepenedOpenQuestions,
    };
  }, [deepenedReflection, deepenedOpenQuestions]);

  const [useFilMemory, setUseFilMemory] = useState(false);
  const [filTraceCount, setFilTraceCount] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [loadingAugmentedExercise, setLoadingAugmentedExercise] = useState(false);
  const [notice, setNotice] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);
  const [upgradedFromCapture, setUpgradedFromCapture] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savedJournalId, setSavedJournalId] = useState<string | null>(null);
  const [savingJournal, setSavingJournal] = useState(false);
  const draftRestoredRef = useRef(false);

  const busyRef = useRef(false);
  const applyPickedFileRef = useRef<(file: File) => Promise<void>>(async () => {});

  const finishWork = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const cancelWork = useCallback(() => {
    workGenRef.current += 1;
    finishWork();
    setPreparingPhoto(false);
    setLoadingReflection(false);
  }, [finishWork]);

  useEffect(() => () => cancelWork(), [cancelWork]);

  useEffect(() => {
    ensureSessionExerciseId();
  }, [ensureSessionExerciseId]);

  const buildReflectionExtras = useCallback((): ReflectionDraftExtras => {
    return {
      reflection,
      openQuestions,
      followUpExercise,
      experienceMode,
      workflowPhase,
      deepenedReflection,
      deepenedOpenQuestions,
      reflectionSource,
      preAnswers,
      postAnswers,
      transitionAnswers,
      currentRound,
      isSecondRoundPrep,
      round1Snapshot,
      useFilMemory,
      sessionExerciseId,
    };
  }, [
    reflection,
    openQuestions,
    followUpExercise,
    experienceMode,
    workflowPhase,
    deepenedReflection,
    deepenedOpenQuestions,
    reflectionSource,
    preAnswers,
    postAnswers,
    transitionAnswers,
    currentRound,
    isSecondRoundPrep,
    round1Snapshot,
    useFilMemory,
    sessionExerciseId,
  ]);

  useEffect(() => {
    void persistRitualDraft("reflection", buildReflectionExtras());
  }, [
    exercise,
    impulse,
    photoUri,
    writtenText,
    buildReflectionExtras,
  ]);

  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    void (async () => {
      const draft = await getRitualDraft();
      if (!draft || draft.step !== "reflection") return;
      if (
        draft.impulse !== impulse ||
        draft.technique !== technique ||
        draft.exercise !== exercise
      ) {
        return;
      }
      const extras = draft.reflectionExtras;
      if (!extras) return;
      if (extras.workflowPhase) {
        setWorkflowPhase(extras.workflowPhase);
      }
      if (extras.deepenedReflection !== undefined) {
        setDeepenedReflection(extras.deepenedReflection);
      }
      if (extras.deepenedOpenQuestions) {
        setDeepenedOpenQuestions(extras.deepenedOpenQuestions);
      }
      if (extras.reflectionSource !== undefined) {
        setReflectionSource(extras.reflectionSource);
      }
      if (extras.useFilMemory !== undefined) {
        setUseFilMemory(extras.useFilMemory);
      }
    })();
  }, [exercise, impulse, technique]);

  function startWork(): { signal: AbortSignal; generation: number } {
    finishWork();
    workGenRef.current += 1;
    const generation = workGenRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    return { signal: controller.signal, generation };
  }

  function isStale(generation: number): boolean {
    return generation !== workGenRef.current;
  }

  async function applyPrepared(prepared: {
    dataUrl: string;
    previewUri: string;
    byteSize: number;
  }) {
    setPhotoUri(prepared.previewUri);
    setPhotoDataUrl(prepared.dataUrl);
    setPhotoSizeLabel(formatImageSize(prepared.byteSize));
    setReflectionSource(null);
    setNotice({
      type: "success",
      message: prepared.uploadReady
        ? t("reflection.notice.photoReady", {
            size: formatImageSize(prepared.byteSize),
            max: uploadMaxLabel(),
          })
        : t("reflection.notice.photoCompressed", {
            size: formatImageSize(prepared.byteSize),
          }),
    });
  }

  async function applyPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    const { signal, generation } = startWork();
    setPreparingPhoto(true);
    setNotice({
      type: "info",
      message: t("reflection.notice.compressing"),
    });

    const timeoutMs = asset.fileSize
      ? processTimeoutMs(asset.fileSize)
      : DEFAULT_PROCESS_TIMEOUT_MS;

    try {
      const prepared = await withTimeout(
        prepareImageFromAsset(asset, signal),
        timeoutMs,
        () => finishWork()
      );
      if (isStale(generation)) return;
      await applyPrepared(prepared);
    } catch (error) {
      if (isStale(generation)) return;
      if (error instanceof ImageProcessingAbortedError) {
        return;
      }
      setPhotoUri(null);
      setPhotoDataUrl(null);
      setPhotoSizeLabel(null);
      setNotice({ type: "error", message: imageErrorMessage(error, t) });
    } finally {
      if (!isStale(generation)) {
        finishWork();
        setPreparingPhoto(false);
      }
    }
  }

  async function applyPickedFile(file: File) {
    const { signal, generation } = startWork();
    setPreparingPhoto(true);
    setNotice({
      type: "info",
      message: t("reflection.notice.compressingFile", {
        size: formatImageSize(file.size),
        max: uploadMaxLabel(),
      }),
    });

    const timeoutMs = processTimeoutMs(file.size);

    try {
      const prepared = await withTimeout(
        prepareImageFromFile(file, signal),
        timeoutMs,
        () => finishWork()
      );
      if (isStale(generation)) return;
      await applyPrepared(prepared);
    } catch (error) {
      if (isStale(generation)) return;
      if (error instanceof ImageProcessingAbortedError) {
        return;
      }
      setPhotoUri(null);
      setPhotoDataUrl(null);
      setPhotoSizeLabel(null);
      setNotice({ type: "error", message: imageErrorMessage(error, t) });
    } finally {
      if (!isStale(generation)) {
        finishWork();
        setPreparingPhoto(false);
      }
    }
  }

  applyPickedFileRef.current = applyPickedFile;

  async function handlePickFromGallery() {
    try {
      if (Platform.OS === "web") {
        const file = await pickImageFileWeb();
        if (file) {
          await applyPickedFile(file);
        }
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setNotice({
          type: "error",
          message: t("reflection.notice.galleryPermission"),
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(
        getImagePickerOptions()
      );

      if (!result.canceled && result.assets[0]) {
        await applyPickedAsset(result.assets[0]);
      }
    } catch {
      setNotice({
        type: "error",
        message: t("reflection.notice.galleryFailed"),
      });
    }
  }

  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice({
          type: "error",
          message: t("reflection.notice.cameraPermission"),
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync(getImagePickerOptions());

      if (!result.canceled && result.assets[0]) {
        await applyPickedAsset(result.assets[0]);
      }
    } catch {
      setNotice({
        type: "error",
        message: t("reflection.notice.cameraFailed"),
      });
    }
  }

  async function resolvePhotoDataUrl(): Promise<string> {
    if (photoDataUrl) {
      return photoDataUrl;
    }
    if (!photoUri) {
      throw new Error(t("reflection.notice.noPhotoSelected"));
    }
    const raw = photoUri.startsWith("data:")
      ? photoUri
      : await uriToDataUrl(photoUri);
    return prepareImageDataUrl(raw);
  }

  async function handleTranscribePhoto() {
    if (!photoUri || preparingPhoto || ocrLoading) return;

    const { signal, generation } = startWork();
    setOcrLoading(true);
    setNotice({
      type: "info",
      message: t("reflection.notice.ocrReading"),
    });

    try {
      const rawDataUrl = await withTimeout(
        resolvePhotoDataUrl(),
        DEFAULT_PROCESS_TIMEOUT_MS,
        () => finishWork()
      );
      if (isStale(generation)) return;

      const imageBase64 = await withTimeout(
        prepareImageForAnalysis(rawDataUrl, signal),
        DEFAULT_PROCESS_TIMEOUT_MS,
        () => finishWork()
      );
      if (isStale(generation)) return;

      const result = await withTimeout(transcribeHandwriting(imageBase64), 90_000);
      if (isStale(generation)) return;

      if (result.text.trim()) {
        setWrittenText(result.text.trim());
        setNotice({
          type: "success",
          message:
            result.source === "ai"
              ? t("reflection.notice.ocrDone")
              : t("reflection.notice.ocrPartial"),
        });
      } else {
        setNotice({
          type: "error",
          message: t("reflection.notice.ocrUnreadable"),
        });
      }
    } catch (error) {
      if (isStale(generation)) return;
      const message =
        error instanceof ApiError
          ? error.message
          : t("reflection.notice.ocrFailed");
      setNotice({ type: "error", message });
    } finally {
      if (!isStale(generation)) {
        finishWork();
        setOcrLoading(false);
      }
    }
  }

  async function handleRequestReflection() {
    const hasText = writtenText.trim().length >= 10;
    const hasDeepContext =
      isDeep &&
      (preAnswers.emotionalWord.trim().length >= 2 ||
        preAnswers.anchorMoment.trim().length >= 2);

    // Techniques performatives sans clé IA : miroir local uniquement.
    if (techniqueNeedsByokForAi && !byokConfigured) {
      const mergedText =
        currentRound === 2 && round1Snapshot
          ? mergeWrittenTextWithSecondRound(
              writtenText,
              round1Snapshot,
              transitionAnswers
            )
          : isDeep
            ? mergeWrittenTextWithPreAnalysis(writtenText, preAnswers)
            : hasText
              ? writtenText.trim()
              : undefined;
      const local = getLocalReflection({
        impulse,
        exercise,
        technique,
        writtenText: mergedText,
      });
      setReflection(
        local.reflection,
        local.openQuestions,
        local.followUpExercise ?? null
      );
      setReflectionSource("fallback");
      setDeepenedReflection(null);
      setDeepenedOpenQuestions([]);
      setNotice({
        type: "info",
        message: t("reflection.notice.localMirror"),
      });
      return;
    }

    if ((!photoUri && !hasText && !hasDeepContext) || preparingPhoto) {
      if (!hasText && !photoUri && !hasDeepContext) {
        setNotice({
          type: "error",
          message: isWriting
            ? t("reflection.notice.needTextWriting")
            : techniqueNeedsByokForAi
              ? t("reflection.notice.needFeeling")
              : t("reflection.notice.needPhotoOrText"),
        });
      }
      return;
    }

    const { signal, generation } = startWork();
    setLoadingReflection(true);
    setReflectionSource(null);
    setDeepenedReflection(null);
    setDeepenedOpenQuestions([]);
    setNotice({
      type: "info",
      message: t("reflection.notice.analyzing"),
    });
    try {
      let imageBase64: string | undefined;

      if (photoUri) {
        const rawDataUrl = await withTimeout(
          resolvePhotoDataUrl(),
          DEFAULT_PROCESS_TIMEOUT_MS,
          () => finishWork()
        );
        if (isStale(generation)) return;

        imageBase64 = await withTimeout(
          prepareImageForAnalysis(rawDataUrl, signal),
          DEFAULT_PROCESS_TIMEOUT_MS,
          () => finishWork()
        );
        if (isStale(generation)) return;

        setPhotoDataUrl(imageBase64);
        setPhotoSizeLabel(formatImageSize(getImageByteSize(imageBase64)));
      }

      const textForApi =
        currentRound === 2 && round1Snapshot
          ? mergeWrittenTextWithSecondRound(
              writtenText,
              round1Snapshot,
              transitionAnswers
            )
          : isDeep
            ? mergeWrittenTextWithPreAnalysis(writtenText, preAnswers)
            : hasText
              ? writtenText.trim()
              : undefined;

      let practiceContext: string | undefined;
      if (useFilMemory) {
        try {
          const entries = await getFilEntries();
          const byokActive = Boolean(
            await resolveByokCredentials().catch(() => null)
          );
          const built = buildPracticeContextFromFil(entries, {
            technique,
            compact: !byokActive,
            maxEntries: byokActive
              ? PRACTICE_CONTEXT_MAX_ENTRIES
              : PRACTICE_CONTEXT_MAX_ENTRIES_COMPACT,
          });
          if (built.trim().length >= 20) {
            practiceContext = built;
          }
        } catch {
          /* Fil optionnel */
        }
      }

      const result = await withTimeout(
        analyzeArtwork({
          imageBase64,
          impulse,
          technique: technique ?? undefined,
          exercise,
          durationMinutes,
          writtenText: textForApi,
          colorContext: colorContext ?? undefined,
          practiceContext,
        }),
        90_000
      );
      if (isStale(generation)) return;

      setReflection(
        result.reflection,
        result.openQuestions,
        result.followUpExercise ?? null
      );
      setReflectionSource(result.source);

      if (result.source === "fallback") {
        setNotice({
          type: "error",
          message: result.analysisNote
            ? t("reflection.notice.analysisFallbackNote", {
                note: result.analysisNote,
              })
            : t("reflection.notice.analysisFallback"),
        });
      } else if (result.analysisNote?.trim()) {
        setNotice({
          type: "info",
          message: result.analysisNote.trim(),
        });
      } else {
        setNotice(null);
      }
    } catch (error) {
      if (isStale(generation)) return;
      if (error instanceof ImageProcessingAbortedError) {
        return;
      }
      const message =
        error instanceof Error && error.message === "TIMEOUT"
          ? t("reflection.notice.analysisTimeout")
          : error instanceof ImageSourceTooLargeError ||
              error instanceof ImageTooLargeError ||
              error instanceof ImageCloudFileError ||
              error instanceof ImageReadTimeoutError ||
              error instanceof ImageCompressionError
            ? error.message
            : error instanceof ApiError
              ? error.message
              : t("reflection.notice.analysisFailed");
      setNotice({ type: "error", message });
    } finally {
      if (!isStale(generation)) {
        finishWork();
        setLoadingReflection(false);
      }
    }
  }

  const bindWebDropZone = useCallback((ref: View | null) => {
    if (Platform.OS !== "web" || !ref) return;

    const node = ref as unknown as HTMLElement;
    if (node.dataset.dropBound === "1") return;
    node.dataset.dropBound = "1";

    const prevent = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    node.addEventListener("dragenter", (event) => {
      prevent(event);
      setDragOver(true);
    });
    node.addEventListener("dragover", prevent);
    node.addEventListener("dragleave", (event) => {
      prevent(event);
      setDragOver(false);
    });
    node.addEventListener("drop", (event) => {
      prevent(event);
      setDragOver(false);
      if (busyRef.current) return;
      const file = extractImageFileFromDataTransfer(event.dataTransfer!);
      if (file) {
        void applyPickedFileRef.current(file);
      } else {
        setNotice({
          type: "error",
          message: t("reflection.notice.dropImageOnly"),
        });
      }
    });
  }, [t]);

  useEffect(() => {
    if (!reflection) {
      filRecordedRef.current = false;
      filEntryIdRef.current = null;
      return;
    }
    if (!technique || !exercise || filRecordedRef.current) return;
    // Express et profond : dès le miroir (sinon les saisons / deep sans questionnaire
    // final n'apparaissent jamais dans le Fil).
    filRecordedRef.current = true;

    void (async () => {
      let storedPhotoUri = photoUri ?? undefined;
      try {
        if (photoUri) {
          storedPhotoUri = await resolvePhotoDataUrl();
          setPhotoDataUrl(storedPhotoUri);
        }
      } catch {
        /* conserve l'URI d'origine si la compression échoue */
      }

      const ritualTitle =
        impulse || t("reflection.defaults.defaultRitualTitle");
      const deepenSnapshot = deepenPersistRef.current;
      const entry = await recordFilEntry({
        source: "ritual",
        summary:
          currentRound === 2
            ? `${ritualTitle}${t("reflection.metaRound2")}`
            : ritualTitle,
        detail: reflection.slice(0, 280),
        metadata: {
          impulse,
          technique,
          techniqueLabel: ritual.techniqueLabel ?? undefined,
          exercise,
          exerciseDevelopment: ritual.exerciseDevelopment ?? undefined,
          moduleStatement: ritual.moduleStatement ?? undefined,
          ...(ritual.seasonTitle
            ? { seasonTitle: ritual.seasonTitle }
            : {}),
          durationMinutes,
          photoUri: storedPhotoUri,
          reflection,
          ...(deepenSnapshot.reflection
            ? { deepenedReflection: deepenSnapshot.reflection }
            : {}),
          openQuestions: openQuestions.length ? openQuestions : undefined,
          ...(deepenSnapshot.questions.length
            ? { deepenedOpenQuestions: deepenSnapshot.questions }
            : {}),
          writtenText: writtenText.trim() || undefined,
          followUpExercise: followUpExercise ?? undefined,
          ...(paletteColors.length ? { colors: paletteColors } : {}),
          ...(colorContext ? { colorContext } : {}),
        },
      });
      filEntryIdRef.current = entry.id;

      // Si l'approfondissement a abouti pendant l'enregistrement, le rattacher.
      const lateDeepen = deepenPersistRef.current;
      if (
        lateDeepen.reflection &&
        lateDeepen.reflection !== deepenSnapshot.reflection
      ) {
        await patchFilEntry(entry.id, {
          metadata: {
            ...entry.metadata,
            deepenedReflection: lateDeepen.reflection,
            ...(lateDeepen.questions.length
              ? { deepenedOpenQuestions: lateDeepen.questions }
              : {}),
          },
        });
      }

      if (storedPhotoUri?.startsWith("data:")) {
        const { tryUploadArtworkToCloud } = await import(
          "@/lib/integrations/upload"
        );
        void tryUploadArtworkToCloud(storedPhotoUri, entry.id);
      }
      await discardRitualDraft();
      setNotice({
        type: "success",
        message: t("reflection.notice.filSaved"),
      });
    })();
  }, [
    reflection,
    technique,
    exercise,
    impulse,
    durationMinutes,
    photoUri,
    openQuestions,
    followUpExercise,
    writtenText,
    currentRound,
    round1Snapshot,
    colorContext,
    paletteColors,
    t,
    ritual.techniqueLabel,
    ritual.exerciseDevelopment,
    ritual.moduleStatement,
  ]);

  function handleGoHome() {
    cancelWork();
    reset();
    navigateHome();
  }

  function handleGoBack() {
    cancelWork();
    if (workflowPhase === "pre_analysis" && upgradedFromCapture) {
      setExperienceMode("express");
      setUpgradedFromCapture(false);
      setWorkflowPhase("capture");
      return;
    }
    if (workflowPhase === "post_integration") {
      setWorkflowPhase("capture");
      return;
    }
    if (workflowPhase === "complete") {
      setWorkflowPhase("post_integration");
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.exercise);
    }
  }

  function handleCancel() {
    cancelWork();
    setNotice({
      type: "info",
      message: t("reflection.notice.cancelled"),
    });
  }

  function handleStartFollowUp() {
    startFollowUpExercise();
    router.push(ROUTES.exercise);
  }

  async function handleDeepenReflection() {
    if (!reflection?.trim() || loadingReflection) return;
    const previousMirror = reflection.trim();
    const alreadyDeepened = deepenedReflection?.trim() || "";
    const { generation } = startWork();
    setLoadingReflection(true);
    setNotice({
      type: "info",
      message: t("reflection.notice.deepening"),
    });
    try {
      const feedback = sessionExerciseId
        ? await getReflectionFeedback(sessionExerciseId)
        : null;
      const feedbackContext = buildDeepenFeedbackContext(feedback);

      const deepenWritten = [
        writtenText.trim() || null,
        feedbackContext,
        `[Demande d'approfondissement du miroir créatif]
Miroir initial (à conserver — ne pas recopier) :
« ${previousMirror.slice(0, 2800)} »`,
        alreadyDeepened
          ? `Approfondissement déjà proposé (aller encore plus loin, sans répéter) :
« ${alreadyDeepened.slice(0, 2000)} »`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const result = await withTimeout(
        analyzeArtwork({
          impulse: (
            impulse || t("reflection.defaults.defaultDeepenImpulse")
          ).slice(0, 200),
          technique: technique ?? undefined,
          exercise: exercise?.slice(0, 3000),
          durationMinutes,
          previousReflection: [previousMirror, alreadyDeepened]
            .filter(Boolean)
            .join("\n\n---\n\n")
            .slice(0, 6000),
          writtenText: deepenWritten.slice(0, 8000),
          colorContext:
            colorContext && colorContext.trim().length >= 10
              ? colorContext.trim().slice(0, 2000)
              : undefined,
          imageBase64: photoDataUrl?.startsWith("data:")
            ? photoDataUrl
            : undefined,
        }),
        90_000
      );
      if (isStale(generation)) return;

      const nextReflection = (result.reflection ?? "").trim();
      if (nextReflection.length < 40) {
        setNotice({
          type: "error",
          message:
            result.analysisNote?.trim() || t("reflection.notice.deepenEmpty"),
        });
        return;
      }

      // Conserve le miroir créatif initial ; l'approfondissement s'affiche en dessous.
      setDeepenedReflection(nextReflection);
      setDeepenedOpenQuestions(result.openQuestions ?? []);
      deepenPersistRef.current = {
        reflection: nextReflection,
        questions: result.openQuestions ?? [],
      };

      const filId = filEntryIdRef.current;
      if (filId) {
        void (async () => {
          const existing = await getFilEntryById(filId);
          if (!existing) return;
          await patchFilEntry(filId, {
            metadata: {
              ...existing.metadata,
              reflection: existing.metadata?.reflection ?? previousMirror,
              deepenedReflection: nextReflection,
              ...(result.openQuestions?.length
                ? { deepenedOpenQuestions: result.openQuestions }
                : {}),
            },
          });
        })();
      }

      setNotice(
        result.source === "ai"
          ? {
              type: "success",
              message: t("reflection.notice.deepenAdded"),
            }
          : {
              type: "info",
              message:
                result.analysisNote ?? t("reflection.notice.deepenFallback"),
            }
      );
    } catch (error) {
      if (isStale(generation)) return;
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : t("reflection.notice.deepenFailed"),
      });
    } finally {
      if (!isStale(generation)) {
        finishWork();
        setLoadingReflection(false);
      }
    }
  }

  async function handleExportPdf() {
    if (!technique || !exercise || exportingPdf) return;
    setExportingPdf(true);
    try {
      const result = await exportSessionPdf({
        id: sessionExerciseId || `session_${Date.now()}`,
        impulse: impulse || t("reflection.defaults.defaultExerciseTitle"),
        technique,
        exercise: [exercise, ritual.exerciseDevelopment]
          .filter(Boolean)
          .join("\n\n"),
        durationMinutes,
        photoUri: photoUri ?? undefined,
        reflection: composeReflectionWithDeepen(
          reflection,
          deepenedReflection,
          t("reflection.deepenedLabel")
        ),
        openQuestions: resolveOpenQuestionsForPersist(
          openQuestions,
          deepenedOpenQuestions
        ),
        writtenText: writtenText.trim() || undefined,
        followUpExercise: followUpExercise ?? undefined,
        createdAt: new Date().toISOString(),
      });
      setNotice({ type: "success", message: result.message });
    } catch (error) {
      showAlert(
        t("reflection.notice.exportPdfTitle"),
        error instanceof Error
          ? error.message
          : t("reflection.notice.exportFailed")
      );
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleSaveIntegration() {
    if (
      !integrationAnswersComplete(postAnswers) ||
      !technique ||
      !reflection ||
      !exercise
    ) {
      return;
    }

    const logId = createSessionLogId();
    const exerciseId = ensureSessionExerciseId();
    const round1Media =
      round1Snapshot?.photoUri ?? (photoUri && currentRound === 1 ? photoUri : "");
    const round1Analysis =
      round1Snapshot?.reflection ?? (currentRound === 1 ? reflection : "");
    const round1OpenQuestions =
      round1Snapshot?.openQuestions ?? (currentRound === 1 ? openQuestions : []);
    const composedMirror = composeReflectionWithDeepen(
      reflection,
      deepenedReflection,
      t("reflection.deepenedLabel")
    );
    const persistedQuestions = resolveOpenQuestionsForPersist(
      openQuestions,
      deepenedOpenQuestions
    );

    try {
      const sessionData = buildSessionDataPayload(
        {
          exerciseId,
          round1: {
            media: round1Media,
            preAnswers: round1Snapshot?.preAnswers ?? preAnswers,
            aiAnalysis:
              currentRound === 1
                ? composedMirror ?? reflection
                : round1Analysis,
            postAnswers:
              currentRound === 1 ? postAnswers : round1Snapshot?.postAnswers,
            writtenText:
              round1Snapshot?.writtenText ??
              (currentRound === 1 ? writtenText.trim() || undefined : undefined),
            openQuestions:
              currentRound === 1
                ? persistedQuestions ?? openQuestions
                : round1Snapshot?.openQuestions ?? round1OpenQuestions,
          },
          ...(currentRound === 2 && round1Snapshot
            ? {
                round2: {
                  media: photoUri ?? "",
                  transitionAnswers,
                  aiAnalysis: composedMirror ?? reflection,
                  writtenText: writtenText.trim() || undefined,
                  openQuestions: persistedQuestions ?? openQuestions,
                },
              }
            : {}),
        },
        logId
      );

      await saveSessionLog({
        id: logId,
        createdAt: new Date().toISOString(),
        mode: "deep",
        exercise: {
          impulse,
          technique,
          techniqueLabel: getTechniqueLabel(technique),
          exercise,
          durationMinutes,
        },
        sessionData,
        postIntegration: postAnswers,
        writtenText: writtenText.trim() || undefined,
        hasPhoto: Boolean(photoUri || round1Snapshot?.photoUri),
      });
      setSavedJournalId(logId);
      setWorkflowPhase("complete");
      setNotice({
        type: "success",
        message: t("reflection.notice.journalSaved"),
      });

      const deepenTrimmed = deepenedReflection?.trim() || "";
      const filId = filEntryIdRef.current;
      if (filId) {
        const existing = await getFilEntryById(filId);
        if (existing) {
          await patchFilEntry(filId, {
            detail: postAnswers.resonance.trim().slice(0, 280),
            metadata: {
              ...existing.metadata,
              impulse,
              technique,
              exercise,
              durationMinutes,
              reflection,
              ...(deepenTrimmed ? { deepenedReflection: deepenTrimmed } : {}),
              openQuestions: openQuestions.length ? openQuestions : undefined,
              ...(deepenedOpenQuestions.length
                ? { deepenedOpenQuestions }
                : {}),
              writtenText: writtenText.trim() || undefined,
              followUpExercise: followUpExercise ?? undefined,
              moduleStatement:
                existing.metadata?.moduleStatement ??
                ritual.moduleStatement ??
                undefined,
              seasonTitle:
                existing.metadata?.seasonTitle ??
                ritual.seasonTitle ??
                undefined,
            },
            tags: existing.tags,
          });
        }
      } else {
        await recordFilEntry({
          source: "ritual",
          summary: impulse || t("reflection.defaults.defaultDeepSession"),
          detail: postAnswers.resonance.trim().slice(0, 280),
          metadata: {
            impulse,
            technique,
            exercise,
            durationMinutes,
            reflection,
            ...(deepenTrimmed ? { deepenedReflection: deepenTrimmed } : {}),
            openQuestions: openQuestions.length ? openQuestions : undefined,
            ...(deepenedOpenQuestions.length
              ? { deepenedOpenQuestions }
              : {}),
            writtenText: writtenText.trim() || undefined,
            followUpExercise: followUpExercise ?? undefined,
            moduleStatement: ritual.moduleStatement ?? undefined,
            ...(ritual.seasonTitle
              ? { seasonTitle: ritual.seasonTitle }
              : {}),
          },
        });
      }
      await discardRitualDraft();
    } catch {
      setNotice({
        type: "error",
        message: t("reflection.notice.journalFailed"),
      });
    }
  }

  async function handleSaveExpressJournal() {
    if (!technique || !reflection || !exercise || !round1Snapshot || savingJournal) {
      return;
    }

    const logId = createSessionLogId();
    const exerciseId = ensureSessionExerciseId();
    const composedMirror = composeReflectionWithDeepen(
      reflection,
      deepenedReflection,
      t("reflection.deepenedLabel")
    );
    const persistedQuestions = resolveOpenQuestionsForPersist(
      openQuestions,
      deepenedOpenQuestions
    );

    setSavingJournal(true);
    try {
      const sessionData = buildSessionDataPayload(
        {
          exerciseId,
          round1: {
            media: round1Snapshot.photoUri ?? "",
            preAnswers: round1Snapshot.preAnswers,
            aiAnalysis: round1Snapshot.reflection,
            postAnswers: round1Snapshot.postAnswers,
            writtenText: round1Snapshot.writtenText,
            openQuestions: round1Snapshot.openQuestions,
          },
          round2: {
            media: photoUri ?? "",
            transitionAnswers,
            aiAnalysis: composedMirror ?? reflection,
            writtenText: writtenText.trim() || undefined,
            openQuestions: persistedQuestions ?? openQuestions,
          },
        },
        logId
      );

      await saveSessionLog({
        id: logId,
        createdAt: new Date().toISOString(),
        mode: "express",
        exercise: {
          impulse,
          technique,
          techniqueLabel: getTechniqueLabel(technique),
          exercise,
          durationMinutes,
        },
        sessionData,
        postIntegration: {
          resonance: transitionAnswers.newIntention.trim(),
          intention: transitionAnswers.gestureChange.trim(),
          keeper: transitionAnswers.physicalState.trim(),
        },
        writtenText: writtenText.trim() || undefined,
        hasPhoto: Boolean(photoUri || round1Snapshot.photoUri),
      });

      setSavedJournalId(logId);
      setNotice({
        type: "success",
        message: t("reflection.notice.expressJournalSaved"),
      });
      await discardRitualDraft();
    } catch {
      setNotice({
        type: "error",
        message: t("reflection.notice.journalFailed"),
      });
    } finally {
      setSavingJournal(false);
    }
  }

  function handleUpgradeToDeep() {
    setUpgradedFromCapture(true);
    setExperienceMode("deep");
    setWorkflowPhase("pre_analysis");
  }

  function handleStartSecondRound() {
    if (!reflection || !exercise) return;
    void (async () => {
      let photo = photoUri;
      try {
        if (photoUri) {
          photo = await resolvePhotoDataUrl();
        }
      } catch {
        /* conserve l'URI d'origine */
      }

      const snapshot = buildRound1Snapshot({
        exercise,
        reflection,
        openQuestions,
        preAnswers: isDeep ? { ...preAnswers } : undefined,
        postAnswers:
          isDeep && integrationAnswersComplete(postAnswers)
            ? { ...postAnswers }
            : undefined,
        writtenText: writtenText.trim() || undefined,
        photoUri: photo,
      });

      beginSecondRound(snapshot);
      setWorkflowPhase("second_round_transition");
      setPhotoDataUrl(null);
      setPhotoSizeLabel(null);
      setReflectionSource(null);
      setDeepenedReflection(null);
      setDeepenedOpenQuestions([]);
      deepenPersistRef.current = { reflection: "", questions: [] };
      filRecordedRef.current = false;
      filEntryIdRef.current = null;
      setNotice({
        type: "info",
        message: t("reflection.notice.secondRoundStart"),
      });
    })();
  }

  async function handleContinueSecondRoundPrep() {
    if (!technique || !round1Snapshot) return;

    setLoadingAugmentedExercise(true);
    setNotice({
      type: "info",
      message: t("reflection.notice.augmentedGenerating"),
    });

    try {
      const request = buildAugmentedExerciseRequest(
        impulse,
        technique,
        round1Snapshot,
        durationMinutes
      );
      const result = await generateAugmentedExercise(
        impulse,
        technique,
        request.augmentationContext,
        durationMinutes
      );
      applyAugmentedExercise(
        result.exercise,
        result.source,
        result.keywords,
        result.fallbackNote,
        result.development
      );
      completeSecondRoundPrep();
      setNotice({
        type: "success",
        message:
          result.source === "ai"
            ? t("reflection.notice.augmentedReady")
            : t("reflection.notice.augmentedReadyLocal"),
      });
      router.push(ROUTES.exercise);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("reflection.notice.augmentedFailed");
      setNotice({ type: "error", message });
    } finally {
      setLoadingAugmentedExercise(false);
    }
  }

  const showPreAnalysis = isDeep && workflowPhase === "pre_analysis";
  const showSecondRoundTransition =
    isSecondRoundPrep && workflowPhase === "second_round_transition";
  const showCapture =
    workflowPhase === "capture" && !showSecondRoundTransition;
  const showPostIntegration = isDeep && workflowPhase === "post_integration";
  const showComplete = isDeep && workflowPhase === "complete";
  const showDeepIntegrationCta =
    isDeep &&
    workflowPhase === "capture" &&
    Boolean(reflection) &&
    !isSecondRoundPrep;
  const showDeepGateway =
    !isDeep &&
    currentRound === 1 &&
    workflowPhase === "capture" &&
    !reflection &&
    !isSecondRoundPrep;
  const showSecondRoundCta =
    Boolean(reflection) &&
    currentRound === 1 &&
    !isSecondRoundPrep &&
    workflowPhase === "capture";
  const showExpressJournalCta =
    !isDeep &&
    currentRound === 2 &&
    Boolean(reflection) &&
    Boolean(round1Snapshot) &&
    workflowPhase === "capture";

  const canAnalyze = supportsAiAnalysis
    ? Boolean(photoUri) ||
      writtenText.trim().length >= 10 ||
      (isDeep && preAnswersComplete(preAnswers))
    : true;
  const previewUri = photoDataUrl ?? photoUri;
  const busy =
    preparingPhoto || loadingReflection || ocrLoading || loadingAugmentedExercise;
  busyRef.current = busy;

  const displayOpenQuestions = useMemo(
    () => (reflection ? resolveOpenQuestions(reflection, openQuestions) : []),
    [reflection, openQuestions]
  );

  const displayReflectionBody = useMemo(() => {
    if (!reflection) return "";
    return cleanReflectionBodyForDisplay(
      reflection,
      displayOpenQuestions,
      followUpExercise
    );
  }, [reflection, displayOpenQuestions, followUpExercise]);

  const displayFollowUpExercise = useMemo(
    () => (reflection ? resolveFollowUpExercise(reflection, followUpExercise) : null),
    [reflection, followUpExercise]
  );

  const screenHero = useMemo(() => {
    switch (workflowPhase) {
      case "pre_analysis":
        return {
          label: t("reflection.heroDeepLabel"),
          title: t("reflection.heroPreTitle"),
          accent: t("reflection.heroPreAccent"),
          description: t("reflection.heroPreDescription"),
        };
      case "post_integration":
        return {
          label: t("reflection.heroDeepLabel"),
          title: t("reflection.heroPostTitle"),
          accent: t("reflection.heroPostAccent"),
          description: t("reflection.heroPostDescription"),
        };
      case "second_round_transition":
        return {
          label: t("reflection.heroTransitionLabel"),
          title: t("reflection.heroTransitionTitle"),
          accent: t("reflection.heroTransitionAccent"),
          description: t("reflection.heroTransitionDescription"),
        };
      case "complete":
        return {
          label: t("reflection.heroDeepLabel"),
          title: t("reflection.heroCompleteTitle"),
          accent: t("reflection.heroCompleteAccent"),
          description: t("reflection.heroCompleteDescription"),
        };
      default:
        return {
          label: t("reflection.heroLabel"),
          title: t("reflection.heroTitle"),
          accent: t("reflection.heroAccent"),
          description: undefined as string | undefined,
        };
    }
  }, [workflowPhase, t]);

  const navBackLabel = useMemo(() => {
    if (workflowPhase === "pre_analysis" && upgradedFromCapture) {
      return t("nav.backCapture");
    }
    if (workflowPhase === "post_integration") {
      return t("nav.backReflection");
    }
    if (workflowPhase === "complete") {
      return t("nav.backIntegration");
    }
    return t("nav.back");
  }, [workflowPhase, upgradedFromCapture, t]);

  const showDeepModeEncart =
    isDeep && (workflowPhase === "pre_analysis" || workflowPhase === "post_integration");

  return (
    <ScreenContainer
      refreshable
      fixedHeader={<ScreenNavBar backLabel={navBackLabel} onBack={handleGoBack} />}
      compactTop
    >
      <PastekScreenHero
        label={screenHero.label}
        title={screenHero.title}
        accent={screenHero.accent}
        description={screenHero.description}
        centered
        size="md"
        className="mb-3"
      />
      <RitualProgressBar current="reflection" />

      {notice && (
        <InlineNotice
          type={notice.type}
          message={notice.message}
          onDismiss={
            notice.type === "error" || notice.type === "success"
              ? () => setNotice(null)
              : undefined
          }
        />
      )}

      {showDeepModeEncart && (
        <AccentCard className="mb-4 px-4 py-3">
          <Text className="text-sage-700 text-sm font-medium">
            {workflowPhase === "pre_analysis"
              ? t("reflection.deepEncartPreTitle")
              : t("reflection.deepEncartPostTitle")}
          </Text>
          <Text className="text-sand-600 text-xs leading-5 mt-1">
            {workflowPhase === "pre_analysis"
              ? t("reflection.deepEncartPreBody")
              : t("reflection.deepEncartPostBody")}
          </Text>
        </AccentCard>
      )}

      {(impulse || exercise || technique) && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-4 mb-4">
          {technique && (
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-1">
              {localizedTechniqueLabel(technique, ritual.techniqueLabel)}
              {durationMinutes
                ? t("reflection.metaDuration", { minutes: durationMinutes })
                : ""}
              {isDeep ? t("reflection.metaDeep") : t("reflection.metaExpress")}
              {currentRound === 2 ? t("reflection.metaRound2") : ""}
              {!supportsAiAnalysis ? t("reflection.metaNoAi") : ""}
            </Text>
          )}
          {impulse ? (
            <Text className="text-sand-700 text-sm font-medium mb-2">
              {impulse}
            </Text>
          ) : null}
          {exercise ? (
            <Text className="text-sand-600 text-sm leading-6">{exercise}</Text>
          ) : null}
        </View>
      )}

      {!supportsAiAnalysis && showCapture && (
        <View className="bg-amber-50 rounded-2xl border border-amber-200 px-4 py-3 mb-4">
          <Text className="text-amber-800 text-sm leading-6">
            {t("reflection.noAiNoticePrefix", {
              technique: technique
                ? localizedTechniqueLabel(
                    technique,
                    ritual.techniqueLabel
                  ).toLowerCase()
                : t("reflection.thisTechnique"),
            })}
            <Text className="font-medium">
              {t("reflection.noAiNoticeBold")}
            </Text>
            {t("reflection.noAiNoticeSuffix")}
          </Text>
        </View>
      )}

      {techniqueNeedsByokForAi && byokConfigured && showCapture && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-3 mb-4">
          <Text className="text-sage-800 text-sm leading-6">
            {t("reflection.keyActiveNotice")}
          </Text>
        </View>
      )}

      {showPreAnalysis && (
        <WorkflowStepTransition stepKey="pre_analysis">
          <View className="mb-2">
            <ContextQuestionnaireStep
              answers={preAnswers}
              onChange={setPreAnswers}
            />
            <View className="mt-6">
              <PrimaryButton
                label={t("reflection.continueToCapture")}
                onPress={() => setWorkflowPhase("capture")}
                disabled={!preAnswersComplete(preAnswers)}
                showArrow
              />
            </View>
          </View>
        </WorkflowStepTransition>
      )}

      {showSecondRoundTransition && (
        <WorkflowStepTransition stepKey="second_round_transition">
          <View className="mb-2">
            <SecondRoundTransitionStep
              answers={transitionAnswers}
              onChange={setTransitionAnswers}
              onContinue={() => void handleContinueSecondRoundPrep()}
              loading={loadingAugmentedExercise}
            />
          </View>
        </WorkflowStepTransition>
      )}

      {showCapture && (
        <WorkflowStepTransition stepKey={`capture_${currentRound}`}>
      {currentRound === 2 && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-3 mb-4">
          <Text className="text-sage-700 text-sm leading-6">
            <Text className="font-medium">
              {t("reflection.round2NoticeBold")}
            </Text>
            {t("reflection.round2NoticeBody")}
          </Text>
        </View>
      )}

      {showDeepGateway && <DeepModeGatewayPrompt onUpgrade={handleUpgradeToDeep} />}
      {isWriting && (
        <View className="mb-6">
          <Text className="text-sand-700 text-base font-medium mb-2">
            {t("reflection.writingTitle")}
          </Text>
          <Text className="text-sand-500 text-sm leading-6 mb-3">
            {t("reflection.writingHint")}
          </Text>
          <TextInput
            className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base min-h-[140px] mb-2"
            multiline
            textAlignVertical="top"
            placeholder={t("reflection.writingPlaceholder")}
            placeholderTextColor="#A89F91"
            value={writtenText}
            onChangeText={setWrittenText}
            editable={!busy}
          />
          <Text className="text-sand-400 text-xs">
            {writtenText.trim().length >= 10
              ? t("reflection.writingReady")
              : t("reflection.writingMin")}
          </Text>
        </View>
      )}

      {!isWriting && techniqueNeedsByokForAi && (
        <View className="mb-6">
          <Text className="text-sand-700 text-base font-medium mb-2">
            {t("reflection.feelingTitle")}
          </Text>
          <TextInput
            className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base min-h-[120px] mb-2"
            multiline
            textAlignVertical="top"
            placeholder={t("reflection.feelingPlaceholder")}
            placeholderTextColor="#A89F91"
            value={writtenText}
            onChangeText={setWrittenText}
            editable={!busy}
          />
        </View>
      )}

      {!isWriting && (
        <Text className="text-sand-700 text-base font-medium mb-2">
          {supportsAiAnalysis
            ? t("reflection.photoTitleCreation")
            : t("reflection.photoTitleSouvenir")}
        </Text>
      )}
      {isWriting && (
        <Text className="text-sand-700 text-base font-medium mb-2">
          {t("reflection.photoTitleOptional")}
        </Text>
      )}

      {busy && (
        <Pressable onPress={handleCancel} className="mb-4">
          <Text className="text-red-500 text-sm text-center font-medium">
            {t("reflection.cancelInProgress")}
          </Text>
        </Pressable>
      )}

      {previewUri ? (
          <View ref={bindWebDropZone}>
            <Image
              source={{ uri: previewUri }}
              className="w-full h-64 rounded-2xl mb-2 bg-sand-200"
              resizeMode="cover"
            />
            {Platform.OS === "web" && dragOver && (
              <View className="absolute inset-0 rounded-2xl bg-sage-500/20 items-center justify-center mb-2">
                <Text className="text-sage-700 text-sm font-medium">
                  {t("reflection.dropReplace")}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            ref={bindWebDropZone}
            className={`w-full h-48 rounded-2xl border border-dashed items-center justify-center mb-2 px-6 ${
              dragOver
                ? "bg-sage-50 border-sage-400"
                : "bg-sand-100 border-sand-300"
            }`}
          >
            <Text className="text-sand-500 text-sm text-center leading-6">
              {Platform.OS === "web"
                ? dragOver
                  ? t("reflection.dropAdd")
                  : isWriting
                    ? t("reflection.dropHintWriting")
                    : t("reflection.dropHint")
                : isWriting
                  ? t("reflection.nativeHintWriting")
                  : t("reflection.noPhotoYet")}
            </Text>
          </View>
        )}

        <Text className="text-sand-400 text-xs mb-4 leading-5">
          {supportsAiAnalysis ? (
            <>
              {t("reflection.sizeHint", {
                max: maxSourceLabel(),
                upload: uploadMaxLabel(),
              })}
              {photoSizeLabel
                ? t("reflection.sizeCurrent", { size: photoSizeLabel })
                : ""}
              {Platform.OS === "web" ? t("reflection.sizeWebCompress") : ""}
            </>
          ) : (
            t("reflection.noPhotoSent")
          )}
        </Text>

        <View className="gap-3 mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label={
                  isWriting
                    ? t("reflection.photographWriting")
                    : t("reflection.photographWork")
                }
                onPress={handleTakePhoto}
                variant="secondary"
                disabled={busy}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={
                  Platform.OS === "web"
                    ? t("reflection.pickWeb")
                    : t("reflection.pickGallery")
                }
                onPress={handlePickFromGallery}
                variant="ghost"
                disabled={busy}
              />
            </View>
          </View>
          {isWriting && photoUri && (
            <PrimaryButton
              label={
                ocrLoading
                  ? t("reflection.ocrCtaLoading")
                  : t("reflection.ocrCta")
              }
              onPress={handleTranscribePhoto}
              variant="secondary"
              disabled={busy}
            />
          )}

          {!isWriting && !techniqueNeedsByokForAi && (
            <View className="mb-1">
              <Text className="text-sand-700 text-base font-medium mb-2">
                {t("reflection.remarkTitle")}
              </Text>
              <Text className="text-sand-500 text-sm leading-6 mb-3">
                {t("reflection.remarkHint")}
              </Text>
              <TextInput
                className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base min-h-[100px] mb-1"
                multiline
                textAlignVertical="top"
                placeholder={t("reflection.remarkPlaceholder")}
                placeholderTextColor="#A89F91"
                value={writtenText}
                onChangeText={setWrittenText}
                editable={!busy}
                accessibilityLabel={t("reflection.remarkTitle")}
              />
            </View>
          )}

          {filTraceCount > 0 ? (
            <View className="rounded-2xl border border-sage-100 bg-sage-50/80 px-4 py-3 flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-sage-800 text-sm font-medium mb-1">
                  {t("reflection.filMemoryTitle")}
                </Text>
                <Text className="text-sage-700 text-xs leading-5">
                  {t("reflection.filMemoryBody", {
                    max: PRACTICE_CONTEXT_MAX_ENTRIES,
                    available: filTraceCount,
                  })}
                </Text>
              </View>
              <Switch
                value={useFilMemory}
                onValueChange={setUseFilMemory}
                disabled={busy}
                accessibilityLabel={t("reflection.filMemoryA11y")}
              />
            </View>
          ) : null}

          <PrimaryButton
            label={
              loadingReflection
                ? t("reflection.analyzeLoading")
                : preparingPhoto
                  ? t("reflection.analyzePreparing")
                  : supportsAiAnalysis
                    ? useFilMemory
                      ? t("reflection.analyzeWithFil")
                      : t("reflection.analyzeCta")
                    : t("reflection.welcomeFeelingCta")
            }
            onPress={handleRequestReflection}
            disabled={!canAnalyze || busy}
          />
          {loadingReflection && (
            <ZenWaitIndicator active estimatedSeconds={90} />
          )}
          {busy && !loadingReflection && <ActivityIndicator color="#6B8F71" />}
        </View>

        {reflection && (
          <View className="mb-6 gap-4">
            <View className="bg-white rounded-2xl border border-sand-200 px-5 py-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sand-400 text-xs uppercase tracking-wider">
                  {t("reflection.mirrorLabel")}
                </Text>
                {reflectionSource === "fallback" && (
                  <Text className="text-amber-600 text-xs font-medium">
                    {supportsAiAnalysis
                      ? t("reflection.sourceFallback")
                      : t("reflection.sourceNoAi")}
                  </Text>
                )}
                {reflectionSource === "ai" && (
                  <Text className="text-sage-500 text-xs font-medium">
                    {useFilMemory
                      ? t("reflection.sourceAiFil")
                      : t("reflection.sourceAi")}
                  </Text>
                )}
              </View>
              {displayReflectionBody ? (
                <ProgressiveReflection
                  key="miroir-initial"
                  reflection={displayReflectionBody}
                />
              ) : (
                <Text className="text-sand-600 text-sm leading-6">
                  {reflection?.trim()
                    ? reflection
                    : t("reflection.mirrorReady")}
                </Text>
              )}
            </View>

            <ReflectionOpenQuestions questions={displayOpenQuestions} />

            {reflectionSource === "ai" && sessionExerciseId ? (
              <FeedbackWidget
                sessionId={sessionExerciseId}
                aiResponseText={displayReflectionBody || reflection}
              />
            ) : null}

            {reflectionSource === "ai" && (
              <PrimaryButton
                label={
                  loadingReflection && !deepenedReflection
                    ? t("reflection.deepenLoading")
                    : loadingReflection
                      ? t("reflection.deepenAgainLoading")
                      : deepenedReflection
                        ? t("reflection.deepenAgainCta")
                        : t("reflection.deepenCta")
                }
                onPress={() => void handleDeepenReflection()}
                variant="secondary"
                disabled={busy}
              />
            )}

            {deepenedReflection ? (
              <View className="bg-white rounded-2xl border border-sage-200 px-5 py-6">
                <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
                  {t("reflection.deepenedLabel")}
                </Text>
                <ProgressiveReflection
                  key={deepenedReflection.slice(0, 64)}
                  reflection={
                    cleanReflectionBodyForDisplay(
                      deepenedReflection,
                      deepenedOpenQuestions
                    ) || deepenedReflection
                  }
                />
                {deepenedOpenQuestions.length > 0 ? (
                  <View className="mt-4">
                    <ReflectionOpenQuestions questions={deepenedOpenQuestions} />
                  </View>
                ) : null}
              </View>
            ) : null}

            <PrimaryButton
              label={
                exportingPdf
                  ? t("reflection.exportPdfBusy")
                  : t("reflection.exportPdf")
              }
              onPress={() => void handleExportPdf()}
              variant="ghost"
              disabled={exportingPdf}
            />
          </View>
        )}

        {displayFollowUpExercise && !showDeepIntegrationCta && (
          <View className="bg-white rounded-2xl border border-sage-200 px-5 py-5 mb-6">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              {t("reflection.followUpLabel")}
            </Text>
            <Text className="text-sand-700 text-sm font-medium mb-2">
              {t("reflection.followUpTitle")}
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-4">
              {displayFollowUpExercise}
            </Text>
            <PrimaryButton
              label={t("reflection.followUpCta")}
              onPress={handleStartFollowUp}
              variant="secondary"
            />
          </View>
        )}

        {showSecondRoundCta && (
          <View className="mb-6">
            <PrimaryButton
              label={t("reflection.secondRoundCta")}
              onPress={handleStartSecondRound}
              variant="secondary"
            />
          </View>
        )}

        {showExpressJournalCta && (
          <View className="mb-6 gap-3">
            {!savedJournalId ? (
              <PrimaryButton
                label={
                  savingJournal
                    ? t("reflection.saveJournalLoading")
                    : t("reflection.saveJournalCta")
                }
                onPress={() => void handleSaveExpressJournal()}
                disabled={savingJournal}
                variant="secondary"
              />
            ) : (
              <PrimaryButton
                label={t("reflection.viewJournalCta")}
                onPress={() => router.push(ROUTES.filEntry(savedJournalId))}
                variant="secondary"
              />
            )}
          </View>
        )}

        {showDeepIntegrationCta && (
          <View className="mb-6">
            <PrimaryButton
              label={t("reflection.integrationCta")}
              onPress={() => setWorkflowPhase("post_integration")}
            />
          </View>
        )}
        </WorkflowStepTransition>
      )}

      {showPostIntegration && (
        <WorkflowStepTransition stepKey="post_integration">
          <View className="mb-2">
            <IntegrationQuestionnaireStep
              answers={postAnswers}
              onChange={setPostAnswers}
            />
            <View className="mt-6 gap-3">
              <PrimaryButton
                label={t("reflection.saveJournalCta")}
                onPress={() => void handleSaveIntegration()}
                disabled={!integrationAnswersComplete(postAnswers)}
              />
            </View>
          </View>
        </WorkflowStepTransition>
      )}

      {showComplete && (
        <WorkflowStepTransition stepKey="complete">
          <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-6 mb-6">
            <Text className="text-sage-700 text-base font-medium mb-2">
              {t("reflection.completeTitle")}
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-4">
              {t("reflection.completeBody")}
            </Text>
            <PrimaryButton
              label={
                exportingPdf
                  ? t("reflection.exportPdfBusy")
                  : t("reflection.exportPdf")
              }
              onPress={() => void handleExportPdf()}
              variant="secondary"
              disabled={exportingPdf}
            />
            {savedJournalId ? (
              <PrimaryButton
                label={t("reflection.viewJournalCta")}
                onPress={() => router.push(ROUTES.filEntry(savedJournalId))}
                variant="ghost"
              />
            ) : null}
          </View>
        </WorkflowStepTransition>
      )}

        {(!isDeep || showComplete) && (
        <View className="flex-row gap-3 pb-8">
          <View className="flex-1">
            <PrimaryButton
              label={t("reflection.viewFil")}
              onPress={() => router.push(ROUTES.fil)}
              variant="secondary"
            />
          </View>
          <View className="flex-1">
            <PrimaryButton
              label={t("reflection.newRitual")}
              onPress={handleGoHome}
              variant="ghost"
            />
          </View>
        </View>
        )}
    </ScreenContainer>
  );
}
