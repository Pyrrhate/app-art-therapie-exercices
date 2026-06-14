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
  formatImageSize,
  getImageByteSize,
  getImagePickerOptions,
  ImageProcessingAbortedError,
  ImageSourceTooLargeError,
  ImageTooLargeError,
  MAX_IMAGE_LABEL,
  MAX_SOURCE_LABEL,
  pickImageFileWeb,
  prepareImageDataUrl,
  prepareImageForAnalysis,
  prepareImageFromAsset,
  prepareImageFromFile,
  uriToDataUrl,
} from "@/lib/image";
import { saveSession } from "@/lib/storage";
import { useRitualStore } from "@/lib/store";
import type { SavedSession } from "@/lib/types";

const PROCESS_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("TIMEOUT")),
      ms
    );
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
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSizeLabel, setPhotoSizeLabel] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [reflectionSource, setReflectionSource] = useState<
    "ai" | "fallback" | null
  >(null);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const cancelWork = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPreparingPhoto(false);
    setLoadingReflection(false);
  }, []);

  useEffect(() => () => cancelWork(), [cancelWork]);

  function startWork(): AbortSignal {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
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
      message: `Photo prête (${formatImageSize(prepared.byteSize)} · max ${MAX_IMAGE_LABEL}).`,
    });
  }

  async function applyPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    const signal = startWork();
    setPreparingPhoto(true);
    setNotice({
      type: "info",
      message: "Préparation de la photo… Vous pouvez annuler ci-dessous.",
    });

    try {
      const prepared = await withTimeout(
        prepareImageFromAsset(asset, signal),
        PROCESS_TIMEOUT_MS
      );
      await applyPrepared(prepared);
    } catch (error) {
      if (error instanceof ImageProcessingAbortedError) {
        return;
      }
      setPhotoUri(null);
      setPhotoDataUrl(null);
      setPhotoSizeLabel(null);
      setNotice({
        type: "error",
        message:
          error instanceof Error && error.message === "TIMEOUT"
            ? "La photo met trop de temps à se préparer. Essayez une image plus légère."
            : error instanceof ImageSourceTooLargeError ||
                error instanceof ImageTooLargeError
              ? error.message
              : "Impossible de préparer cette photo. Essayez une autre image.",
      });
    } finally {
      setPreparingPhoto(false);
      abortRef.current = null;
    }
  }

  async function applyPickedFile(file: File) {
    const signal = startWork();
    setPreparingPhoto(true);
    setNotice({
      type: "info",
      message: "Préparation de la photo… Vous pouvez annuler ci-dessous.",
    });

    try {
      const prepared = await withTimeout(
        prepareImageFromFile(file, signal),
        PROCESS_TIMEOUT_MS
      );
      await applyPrepared(prepared);
    } catch (error) {
      if (error instanceof ImageProcessingAbortedError) {
        return;
      }
      setPhotoUri(null);
      setPhotoDataUrl(null);
      setPhotoSizeLabel(null);
      setNotice({
        type: "error",
        message:
          error instanceof Error && error.message === "TIMEOUT"
            ? "La photo met trop de temps à se préparer. Essayez une image plus légère."
            : error instanceof ImageSourceTooLargeError ||
                error instanceof ImageTooLargeError
              ? error.message
              : "Impossible de préparer cette photo. Essayez une autre image.",
      });
    } finally {
      setPreparingPhoto(false);
      abortRef.current = null;
    }
  }

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

    setLoadingReflection(true);
    setReflectionSource(null);
    setNotice({
      type: "info",
      message:
        "Analyse de votre œuvre en cours… Comptez 15 à 45 secondes. Vous pouvez annuler ci-dessous.",
    });
    try {
      const signal = startWork();
      const rawDataUrl = await withTimeout(
        resolvePhotoDataUrl(),
        PROCESS_TIMEOUT_MS
      );
      const imageBase64 = await withTimeout(
        prepareImageForAnalysis(rawDataUrl, signal),
        PROCESS_TIMEOUT_MS
      );
      setPhotoDataUrl(imageBase64);
      setPhotoSizeLabel(formatImageSize(getImageByteSize(imageBase64)));

      const result = await withTimeout(
        analyzeArtwork(imageBase64, {
          impulse,
          technique: technique ?? undefined,
        }),
        90_000
      );

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
      const message =
        error instanceof Error && error.message === "TIMEOUT"
          ? "Délai dépassé. Réessayez avec une photo plus légère."
          : error instanceof ImageSourceTooLargeError ||
              error instanceof ImageTooLargeError
            ? error.message
            : error instanceof ApiError
              ? error.message
              : "Le serveur n'a pas pu analyser l'image. Vérifiez la connexion API et réessayez.";
      setNotice({ type: "error", message });
    } finally {
      setLoadingReflection(false);
      abortRef.current = null;
    }
  }

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
          <Image
            source={{ uri: previewUri }}
            className="w-full h-64 rounded-2xl mb-2 bg-sand-200"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-48 rounded-2xl bg-sand-100 border border-dashed border-sand-300 items-center justify-center mb-2">
            <Text className="text-sand-400 text-sm">
              Aucune photo pour l'instant
            </Text>
          </View>
        )}

        <Text className="text-sand-400 text-xs mb-4 leading-5">
          Max envoi IA : {MAX_IMAGE_LABEL} · max fichier : {MAX_SOURCE_LABEL}.
          {photoSizeLabel ? ` Actuelle : ${photoSizeLabel}.` : ""}
          {Platform.OS === "web"
            ? " Sur Windows, évitez les photos OneDrive (icône nuage) : copiez l'image sur le Bureau ou téléchargez-la d'abord."
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
            label="Choisir depuis la galerie"
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
