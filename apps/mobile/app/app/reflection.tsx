import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { InlineNotice } from "@/components/InlineNotice";
import { ZenWaitIndicator } from "@/components/ZenWaitIndicator";
import { ProgressiveReflection } from "@/components/reflection/ProgressiveReflection";
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
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { RitualProgressBar } from "@/components/ui/RitualProgressBar";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { analyzeArtwork, ApiError, generateAugmentedExercise, transcribeHandwriting } from "@/lib/api";
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
  MAX_SOURCE_LABEL,
  pickImageFileWeb,
  prepareImageDataUrl,
  prepareImageForAnalysis,
  prepareImageFromAsset,
  prepareImageFromFile,
  processTimeoutMs,
  UPLOAD_MAX_LABEL,
  uriToDataUrl,
} from "@/lib/image";
import { recordFilEntry } from "@/lib/fil/record";
import { useRitualStore } from "@/lib/store";
import { getTechniqueLabel, isAiAnalysisSupported } from "@/constants";
import { getLocalReflection } from "@/lib/reflection/fallback";
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

function imageErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "TIMEOUT") {
    return "La photo met trop de temps à se préparer. Patientez ou choisissez une image plus légère.";
  }
  if (error instanceof ImageCloudFileError) return error.message;
  if (error instanceof ImageReadTimeoutError) return error.message;
  if (error instanceof ImageSourceTooLargeError) return error.message;
  if (error instanceof ImageTooLargeError) return error.message;
  if (error instanceof ImageCompressionError) return error.message;
  if (error instanceof ImageProcessingAbortedError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Impossible de préparer cette photo. Essayez une autre image.";
}

export default function ReflectionScreen() {
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
  } = ritual;

  const isDeep = experienceMode === "deep";
  const [workflowPhase, setWorkflowPhase] = useState<ReflectionWorkflowPhase>(() =>
    initialReflectionPhase(experienceMode)
  );

  const isWriting = technique === "writing";
  const supportsAiAnalysis = technique ? isAiAnalysisSupported(technique) : true;

  const abortRef = useRef<AbortController | null>(null);
  const workGenRef = useRef(0);
  const filRecordedRef = useRef(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSizeLabel, setPhotoSizeLabel] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [reflectionSource, setReflectionSource] = useState<
    "ai" | "fallback" | null
  >(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [loadingAugmentedExercise, setLoadingAugmentedExercise] = useState(false);
  const [notice, setNotice] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

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

  useEffect(() => {
    void persistRitualDraft("reflection");
  }, [exercise, impulse, photoUri, writtenText, reflection]);

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
        ? `Photo prête pour l'IA (${formatImageSize(prepared.byteSize)} · max ${UPLOAD_MAX_LABEL}).`
        : `Photo compressée (${formatImageSize(prepared.byteSize)}).`,
    });
  }

  async function applyPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    const { signal, generation } = startWork();
    setPreparingPhoto(true);
    setNotice({
      type: "info",
      message: "Compression de la photo pour l'IA…",
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
      setNotice({ type: "error", message: imageErrorMessage(error) });
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
      message: `Compression (${formatImageSize(file.size)}) → max ${UPLOAD_MAX_LABEL} pour l'IA…`,
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
      setNotice({ type: "error", message: imageErrorMessage(error) });
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
          message:
            "Autorisez l'accès à la galerie dans les réglages de l'appareil.",
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
        message:
          "Impossible d'ouvrir la galerie. Réessayez ou utilisez la caméra.",
      });
    }
  }

  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice({
          type: "error",
          message:
            "Autorisez l'accès à la caméra pour photographier votre création.",
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
        message: "Impossible d'utiliser la caméra sur cet appareil.",
      });
    }
  }

  async function resolvePhotoDataUrl(): Promise<string> {
    if (photoDataUrl) {
      return photoDataUrl;
    }
    if (!photoUri) {
      throw new Error("Aucune photo sélectionnée.");
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
      message: "Lecture de votre écriture manuscrite…",
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
              ? "Texte extrait — corrigez-le ci-dessus si besoin avant l'analyse."
              : "Transcription partielle — complétez le texte manuellement.",
        });
      } else {
        setNotice({
          type: "error",
          message:
            "Impossible de lire l'écriture. Saisissez le texte à la main ou reprenez une photo plus nette.",
        });
      }
    } catch (error) {
      if (isStale(generation)) return;
      const message =
        error instanceof ApiError
          ? error.message
          : "La transcription a échoué. Saisissez le texte à la main.";
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

    if (!supportsAiAnalysis) {
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
      setNotice({
        type: "info",
        message:
          "Pas d'analyse IA pour cette technique — miroir créatif local, sans envoi au serveur.",
      });
      return;
    }

    if ((!photoUri && !hasText) || preparingPhoto) {
      if (!hasText && !photoUri) {
        setNotice({
          type: "error",
          message: isWriting
            ? "Collez votre texte ou photographiez votre écriture manuscrite."
            : "Ajoutez une photo de votre création.",
        });
      }
      return;
    }

    const { signal, generation } = startWork();
    setLoadingReflection(true);
    setReflectionSource(null);
    setNotice({
      type: "info",
      message:
        "Analyse en cours — laissez le compteur zen vous accompagner. Vous pouvez annuler ci-dessous.",
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

      const result = await withTimeout(
        analyzeArtwork({
          imageBase64,
          impulse,
          technique: technique ?? undefined,
          exercise,
          durationMinutes,
          writtenText: textForApi,
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
          message:
            result.analysisNote
              ? `Analyse IA indisponible (${result.analysisNote}). Questions génériques affichées — réessayez dans quelques minutes.`
              : "L'IA n'a pas pu analyser votre photo (service indisponible). Les questions ci-dessous sont génériques — réessayez dans quelques minutes.",
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
          ? "Délai dépassé. Réessayez avec une photo plus légère."
          : error instanceof ImageSourceTooLargeError ||
              error instanceof ImageTooLargeError ||
              error instanceof ImageCloudFileError ||
              error instanceof ImageReadTimeoutError ||
              error instanceof ImageCompressionError
            ? error.message
            : error instanceof ApiError
              ? error.message
              : "Le serveur n'a pas pu analyser l'image. Vérifiez la connexion API et réessayez.";
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
          message: "Déposez une image (JPG, PNG…), pas un dossier.",
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!reflection) {
      filRecordedRef.current = false;
      return;
    }
    if (!technique || !exercise || filRecordedRef.current) return;
    if (isDeep) return;
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

      await recordFilEntry({
        source: "ritual",
        summary:
          currentRound === 2
            ? `${impulse || "Rituel créatif"} · 2e tour`
            : impulse || "Rituel créatif",
        detail: reflection.slice(0, 280),
        metadata: {
          impulse,
          technique,
          exercise,
          durationMinutes,
          photoUri: storedPhotoUri,
          reflection,
          openQuestions: openQuestions.length ? openQuestions : undefined,
          writtenText: writtenText.trim() || undefined,
          followUpExercise: followUpExercise ?? undefined,
        },
      });
      await discardRitualDraft();
      setNotice({
        type: "success",
        message: "Trace enregistrée dans votre Fil créatif.",
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
    isDeep,
    currentRound,
    round1Snapshot,
  ]);

  function handleGoHome() {
    cancelWork();
    reset();
    navigateHome();
  }

  function handleGoBack() {
    cancelWork();
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
      message: "Opération annulée.",
    });
  }

  function handleStartFollowUp() {
    startFollowUpExercise();
    router.push(ROUTES.exercise);
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

    try {
      const sessionData = buildSessionDataPayload(
        {
          exerciseId,
          round1: {
            media: round1Media,
            preAnswers: round1Snapshot?.preAnswers ?? preAnswers,
            aiAnalysis: round1Analysis,
            postAnswers:
              currentRound === 1 ? postAnswers : round1Snapshot?.postAnswers,
            writtenText:
              round1Snapshot?.writtenText ??
              (currentRound === 1 ? writtenText.trim() || undefined : undefined),
            openQuestions: round1Snapshot?.openQuestions ?? round1OpenQuestions,
          },
          ...(currentRound === 2 && round1Snapshot
            ? {
                round2: {
                  media: photoUri ?? "",
                  transitionAnswers,
                  aiAnalysis: reflection,
                  writtenText: writtenText.trim() || undefined,
                  openQuestions,
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
      setWorkflowPhase("complete");
      setNotice({
        type: "success",
        message: "Votre séance profonde est enregistrée dans le journal local.",
      });

      await recordFilEntry({
        source: "ritual",
        summary: impulse || "Séance profonde",
        detail: postAnswers.resonance.trim().slice(0, 280),
        metadata: {
          impulse,
          technique,
          exercise,
          durationMinutes,
          reflection,
          openQuestions: openQuestions.length ? openQuestions : undefined,
          writtenText: writtenText.trim() || undefined,
          followUpExercise: followUpExercise ?? undefined,
        },
      });
      await discardRitualDraft();
    } catch {
      setNotice({
        type: "error",
        message: "Impossible d'enregistrer le journal pour le moment.",
      });
    }
  }

  function handleUpgradeToDeep() {
    setExperienceMode("deep");
    setWorkflowPhase("pre_analysis");
    setNotice({
      type: "info",
      message: "Mode approfondi activé — trois questions d'ancrage avant l'analyse.",
    });
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
      filRecordedRef.current = false;
      setNotice({
        type: "info",
        message:
          "2e tour — répondez aux questions flash pour préparer un exercice adapté.",
      });
    })();
  }

  async function handleContinueSecondRoundPrep() {
    if (!technique || !round1Snapshot) return;

    setLoadingAugmentedExercise(true);
    setNotice({
      type: "info",
      message: "Génération de votre exercice augmenté…",
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
      applyAugmentedExercise(result.exercise, result.source, result.keywords);
      completeSecondRoundPrep();
      setNotice({
        type: "success",
        message:
          result.source === "ai"
            ? "Exercice augmenté prêt — lancez votre 2e tour."
            : "Exercice adapté localement — lancez votre 2e tour.",
      });
      router.push(ROUTES.exercise);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Impossible de préparer l'exercice augmenté. Réessayez.";
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

  const canAnalyze = supportsAiAnalysis
    ? Boolean(photoUri) || writtenText.trim().length >= 10
    : true;
  const previewUri = photoDataUrl ?? photoUri;
  const busy =
    preparingPhoto || loadingReflection || ocrLoading || loadingAugmentedExercise;
  busyRef.current = busy;

  return (
    <ScreenContainer refreshable fixedHeader={<ScreenNavBar onBack={handleGoBack} />} compactTop>
      <PastekScreenHero
        label="Réflexion"
        title="Capture & "
        accent="réflexion"
        centered={false}
        size="md"
        className="mb-3"
      />
      <RitualProgressBar current="reflection" />

      {notice && (
        <InlineNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {(impulse || exercise || technique) && (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-4 mb-4">
          {technique && (
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-1">
              {getTechniqueLabel(technique)}
              {durationMinutes ? ` · ${durationMinutes} min` : ""}
              {isDeep ? " · parcours profond" : " · parcours express"}
              {currentRound === 2 ? " · 2e tour" : ""}
              {!supportsAiAnalysis ? " · sans analyse IA" : ""}
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
            Pour{" "}
            {technique ? getTechniqueLabel(technique).toLowerCase() : "cette technique"}
            , privilégiez un{" "}
            <Text className="font-medium">miroir textuel</Text> : décrivez ce que
            vous avez vécu, ressenti ou exploré — sans envoi de photo au serveur.
            Une image souvenir reste possible, mais elle ne sera pas analysée par
            l&apos;IA.
          </Text>
        </View>
      )}

      {showPreAnalysis && (
        <WorkflowStepTransition stepKey="pre_analysis">
          <View className="mb-2">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              Parcours profond · Ancrage
            </Text>
            <Text className="text-sand-700 text-base font-medium mb-4">
              Trois questions avant le miroir créatif
            </Text>
            <ContextQuestionnaireStep
              answers={preAnswers}
              onChange={setPreAnswers}
            />
            <View className="mt-6">
              <PrimaryButton
                label="Continuer vers la capture"
                onPress={() => setWorkflowPhase("capture")}
                disabled={!preAnswersComplete(preAnswers)}
              />
            </View>
          </View>
        </WorkflowStepTransition>
      )}

      {showSecondRoundTransition && (
        <WorkflowStepTransition stepKey="second_round_transition">
          <View className="mb-2">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              Réitération rapide · 2e tour
            </Text>
            <Text className="text-sand-700 text-base font-medium mb-4">
              Refaites l&apos;exercice, puis ancrez ce qui a changé
            </Text>
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
            <Text className="font-medium">2e tour — exercice augmenté.</Text>{" "}
            Partagez votre nouvelle création pour une analyse tenant compte de
            votre premier passage et de vos réponses flash.
          </Text>
        </View>
      )}

      {showDeepGateway && <DeepModeGatewayPrompt onUpgrade={handleUpgradeToDeep} />}
      {isWriting && (
        <View className="mb-6">
          <Text className="text-sand-700 text-base font-medium mb-2">
            Votre texte
          </Text>
          <Text className="text-sand-500 text-sm leading-6 mb-3">
            Collez ici ce que vous avez écrit, ou photographiez votre écriture
            manuscrite ci-dessous — l&apos;IA tentera de la lire.
          </Text>
          <TextInput
            className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base min-h-[140px] mb-2"
            multiline
            textAlignVertical="top"
            placeholder="Collez ou saisissez votre texte…"
            placeholderTextColor="#A89F91"
            value={writtenText}
            onChangeText={setWrittenText}
            editable={!busy}
          />
          <Text className="text-sand-400 text-xs">
            {writtenText.trim().length >= 10
              ? "Texte prêt pour l'analyse."
              : "Minimum 10 caractères, ou ajoutez une photo manuscrite."}
          </Text>
        </View>
      )}

      {!isWriting && (
        <Text className="text-sand-700 text-base font-medium mb-2">
          {supportsAiAnalysis ? "Votre création" : "Photo souvenir (optionnelle)"}
        </Text>
      )}
      {isWriting && (
        <Text className="text-sand-700 text-base font-medium mb-2">
          Photo (optionnelle)
        </Text>
      )}

      {busy && (
        <Pressable onPress={handleCancel} className="mb-4">
          <Text className="text-red-500 text-sm text-center font-medium">
            Annuler l'opération en cours
          </Text>
        </Pressable>
      )}

      {loadingReflection && <ZenWaitIndicator active estimatedSeconds={90} />}

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
                  Relâchez pour remplacer
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
                  ? "Relâchez pour ajouter la photo"
                  : isWriting
                    ? "Glissez une photo de votre écriture manuscrite\n(Bureau, Téléchargements…)"
                    : "Glissez une photo ici\n(Bureau, Téléchargements…)"
                : isWriting
                  ? "Photographiez votre écriture manuscrite (optionnel)"
                  : "Aucune photo pour l'instant"}
            </Text>
          </View>
        )}

        <Text className="text-sand-400 text-xs mb-4 leading-5">
          {supportsAiAnalysis ? (
            <>
              Fichier max {MAX_SOURCE_LABEL} · envoi IA max {UPLOAD_MAX_LABEL}.
              {photoSizeLabel ? ` Actuelle : ${photoSizeLabel}.` : ""}
              {Platform.OS === "web"
                ? " Les photos sont automatiquement compressées avant envoi à l'IA."
                : ""}
            </>
          ) : (
            "Aucune photo n'est envoyée au serveur pour cette technique."
          )}
        </Text>

        <View className="gap-3 mb-6">
          <PrimaryButton
            label={
              isWriting
                ? "Photographier mon écriture"
                : "Photographier mon œuvre"
            }
            onPress={handleTakePhoto}
            variant="secondary"
            disabled={busy}
          />
          <PrimaryButton
            label={
              Platform.OS === "web"
                ? "Choisir une photo (Bureau…)"
                : "Choisir depuis la galerie"
            }
            onPress={handlePickFromGallery}
            variant="ghost"
            disabled={busy}
          />
          {isWriting && photoUri && (
            <PrimaryButton
              label={
                ocrLoading
                  ? "Lecture en cours…"
                  : "Extraire le texte de la photo (OCR)"
              }
              onPress={handleTranscribePhoto}
              variant="secondary"
              disabled={busy}
            />
          )}
          <PrimaryButton
            label={
              loadingReflection
                ? "Analyse en cours…"
                : preparingPhoto
                  ? "Préparation..."
                  : supportsAiAnalysis
                    ? "Demander une réflexion bienveillante"
                    : "Accueillir mon ressenti"
            }
            onPress={handleRequestReflection}
            disabled={!canAnalyze || busy}
          />
          {busy && <ActivityIndicator color="#6B8F71" />}
        </View>

        {reflection && (
          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-6 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sand-400 text-xs uppercase tracking-wider">
                Miroir créatif
              </Text>
              {reflectionSource === "fallback" && (
                <Text className="text-amber-600 text-xs font-medium">
                  {supportsAiAnalysis ? "Mode secours" : "Sans analyse IA"}
                </Text>
              )}
              {reflectionSource === "ai" && (
                <Text className="text-sage-500 text-xs font-medium">
                  Analyse IA
                </Text>
              )}
            </View>
            <ProgressiveReflection reflection={reflection} />
            {openQuestions.map((q, i) => (
              <Text key={i} className="text-sand-500 text-sm leading-6 mb-2">
                · {q}
              </Text>
            ))}
          </View>
        )}

        {followUpExercise && !showDeepIntegrationCta && (
          <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-5 mb-6">
            <Text className="text-sage-700 text-sm font-medium mb-2">
              Poursuivre la création
            </Text>
            <Text className="text-sand-600 text-sm leading-6 mb-4">
              {followUpExercise}
            </Text>
            <PrimaryButton
              label="Commencer cet exercice"
              onPress={handleStartFollowUp}
              variant="secondary"
            />
          </View>
        )}

        {showSecondRoundCta && (
          <View className="mb-6">
            <PrimaryButton
              label="Faire un 2nd tour (Réitération rapide)"
              onPress={handleStartSecondRound}
              variant="secondary"
            />
          </View>
        )}

        {showDeepIntegrationCta && (
          <View className="mb-6">
            <PrimaryButton
              label="Poursuivre l'intégration"
              onPress={() => setWorkflowPhase("post_integration")}
            />
          </View>
        )}
        </WorkflowStepTransition>
      )}

      {showPostIntegration && (
        <WorkflowStepTransition stepKey="post_integration">
          <View className="mb-2">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              Parcours profond · Intégration
            </Text>
            <Text className="text-sand-700 text-base font-medium mb-4">
              Clôturer votre séance en douceur
            </Text>
            <IntegrationQuestionnaireStep
              answers={postAnswers}
              onChange={setPostAnswers}
            />
            <View className="mt-6 gap-3">
              <PrimaryButton
                label="Enregistrer dans mon journal"
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
              Séance profonde enregistrée
            </Text>
            <Text className="text-sand-600 text-sm leading-6">
              Votre parcours complet — ancrage, réflexion et intégration — est
              conservé localement. Vous pouvez revenir quand vous le souhaitez.
            </Text>
          </View>
        </WorkflowStepTransition>
      )}

        {(!isDeep || showComplete) && (
        <View className="gap-3 pb-8">
          <PrimaryButton
            label="Voir le Fil créatif"
            onPress={() => router.push(ROUTES.fil)}
            variant="secondary"
          />
          <PrimaryButton
            label="Nouveau rituel"
            onPress={handleGoHome}
            variant="ghost"
          />
        </View>
        )}
    </ScreenContainer>
  );
}
