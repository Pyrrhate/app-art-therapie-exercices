import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { InlineNotice } from "@/components/InlineNotice";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { analyzeArtwork, ApiError } from "@/lib/api";
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
import { saveSession } from "@/lib/storage";
import { useRitualStore } from "@/lib/store";
import type { SavedSession } from "@/lib/types";

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
    setPhotoUri,
    setReflection,
    reset,
  } = ritual;

  const abortRef = useRef<AbortController | null>(null);
  const workGenRef = useRef(0);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSizeLabel, setPhotoSizeLabel] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [reflectionSource, setReflectionSource] = useState<
    "ai" | "fallback" | null
  >(null);
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
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

  async function handleRequestReflection() {
    if (!photoUri || preparingPhoto) return;

    const { signal, generation } = startWork();
    setLoadingReflection(true);
    setReflectionSource(null);
    setNotice({
      type: "info",
      message:
        "Analyse de votre œuvre en cours… Comptez 15 à 45 secondes. Vous pouvez annuler ci-dessous.",
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

      setPhotoDataUrl(imageBase64);
      setPhotoSizeLabel(formatImageSize(getImageByteSize(imageBase64)));

      const result = await withTimeout(
        analyzeArtwork(imageBase64, {
          impulse,
          technique: technique ?? undefined,
        }),
        90_000
      );
      if (isStale(generation)) return;

      setReflection(result.reflection, result.openQuestions);
      setReflectionSource(result.source);

      if (result.source === "fallback") {
        setNotice({
          type: "error",
          message:
            "L'IA n'a pas pu analyser votre photo (service indisponible). Les questions ci-dessous sont génériques — réessayez dans quelques minutes.",
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

  async function handleSave() {
    if (!technique) return;

    let storedPhotoUri = photoUri ?? undefined;
    try {
      if (photoUri) {
        const dataUrl = await resolvePhotoDataUrl();
        storedPhotoUri = dataUrl;
        setPhotoDataUrl(dataUrl);
      }
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ImageTooLargeError
            ? error.message
            : "Impossible de préparer la photo pour la sauvegarde.",
      });
      return;
    }

    const session: SavedSession = {
      id: Date.now().toString(),
      impulse,
      technique,
      exercise,
      durationMinutes,
      photoUri: storedPhotoUri,
      reflection: reflection ?? undefined,
      openQuestions: openQuestions.length ? openQuestions : undefined,
      createdAt: new Date().toISOString(),
    };

    await saveSession(session);
    setSaved(true);
    setNotice({
      type: "success",
      message: "Session enregistrée sur cet appareil.",
    });
  }

  function handleGoHome() {
    cancelWork();
    reset();
    router.replace("/");
  }

  function handleGoBack() {
    cancelWork();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/exercise");
    }
  }

  function handleCancel() {
    cancelWork();
    setNotice({
      type: "info",
      message: "Opération annulée.",
    });
  }

  const previewUri = photoDataUrl ?? photoUri;
  const busy = preparingPhoto || loadingReflection;
  busyRef.current = busy;

  return (
    <ScreenContainer title="Capture & Réflexion">
      <View className="flex-row justify-between items-center mb-4 -mt-2">
        <Pressable onPress={handleGoBack}>
          <Text className="text-sage-500 text-base">← Retour</Text>
        </Pressable>
        <Pressable onPress={handleGoHome}>
          <Text className="text-sand-500 text-sm">Accueil</Text>
        </Pressable>
      </View>

      {notice && (
        <InlineNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {busy && (
        <Pressable onPress={handleCancel} className="mb-4">
          <Text className="text-red-500 text-sm text-center font-medium">
            Annuler l'opération en cours
          </Text>
        </Pressable>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
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
                  : "Glissez une photo ici\n(Bureau, Téléchargements…)"
                : "Aucune photo pour l'instant"}
            </Text>
          </View>
        )}

        <Text className="text-sand-400 text-xs mb-4 leading-5">
          Fichier max {MAX_SOURCE_LABEL} · envoi IA max {UPLOAD_MAX_LABEL}.
          {photoSizeLabel ? ` Actuelle : ${photoSizeLabel}.` : ""}
          {Platform.OS === "web"
            ? " Les photos sont automatiquement compressées avant envoi à l'IA."
            : ""}
        </Text>

        <View className="gap-3 mb-6">
          <PrimaryButton
            label="Photographier mon œuvre"
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
          <PrimaryButton
            label={
              loadingReflection
                ? "Analyse en cours (15–45 s)…"
                : preparingPhoto
                  ? "Préparation..."
                  : "Demander une réflexion bienveillante"
            }
            onPress={handleRequestReflection}
            disabled={!photoUri || busy}
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
                  Mode secours
                </Text>
              )}
              {reflectionSource === "ai" && (
                <Text className="text-sage-500 text-xs font-medium">
                  Analyse IA
                </Text>
              )}
            </View>
            <Text className="text-sand-700 text-base leading-7 mb-4">
              {reflection}
            </Text>
            {openQuestions.map((q, i) => (
              <Text key={i} className="text-sand-500 text-sm leading-6 mb-2">
                · {q}
              </Text>
            ))}
          </View>
        )}

        <View className="gap-3 pb-8">
          <PrimaryButton
            label={saved ? "Sauvegardé ✓" : "Sauvegarder localement"}
            onPress={handleSave}
            disabled={saved || busy}
          />
          <PrimaryButton
            label="Nouveau rituel"
            onPress={handleGoHome}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
