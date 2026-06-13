import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { analyzeArtwork } from "@/lib/api";
import { saveSession } from "@/lib/storage";
import { useRitualStore } from "@/lib/store";
import type { SavedSession } from "@/lib/types";

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

  const [loadingReflection, setLoadingReflection] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handlePickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à la galerie pour choisir une photo de votre création."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ["images"],
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setSaved(false);
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à la caméra pour photographier votre création."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setSaved(false);
    }
  }

  async function handleRequestReflection() {
    if (!photoUri) return;

    setLoadingReflection(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = photoUri.endsWith(".png") ? "png" : "jpeg";
      const imageBase64 = `data:image/${mimeType};base64,${base64}`;

      const result = await analyzeArtwork(imageBase64, {
        impulse,
        technique: technique ?? undefined,
      });

      setReflection(result.reflection, result.openQuestions);
    } catch {
      Alert.alert(
        "Réflexion indisponible",
        "Le serveur n'a pas pu analyser l'image. Une réflexion générique sera proposée à la prochaine tentative."
      );
    } finally {
      setLoadingReflection(false);
    }
  }

  async function handleSave() {
    if (!technique) return;

    const session: SavedSession = {
      id: Date.now().toString(),
      impulse,
      technique,
      exercise,
      durationMinutes,
      photoUri: photoUri ?? undefined,
      reflection: reflection ?? undefined,
      openQuestions: openQuestions.length ? openQuestions : undefined,
      createdAt: new Date().toISOString(),
    };

    await saveSession(session);
    setSaved(true);
    Alert.alert("Sauvegardé", "Votre session est enregistrée sur cet appareil.");
  }

  function handleNewRitual() {
    reset();
    router.replace("/");
  }

  return (
    <ScreenContainer title="Capture & Réflexion">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            className="w-full h-64 rounded-2xl mb-6 bg-sand-200"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-48 rounded-2xl bg-sand-100 border border-dashed border-sand-300 items-center justify-center mb-6">
            <Text className="text-sand-400 text-sm">
              Aucune photo pour l'instant
            </Text>
          </View>
        )}

        <View className="gap-3 mb-6">
          <PrimaryButton
            label="Photographier mon œuvre"
            onPress={handleTakePhoto}
            variant="secondary"
          />
          <PrimaryButton
            label="Choisir depuis la galerie"
            onPress={handlePickFromGallery}
            variant="ghost"
          />
          <PrimaryButton
            label={
              loadingReflection
                ? "Réflexion en cours..."
                : "Demander une réflexion bienveillante"
            }
            onPress={handleRequestReflection}
            disabled={!photoUri || loadingReflection}
          />
          {loadingReflection && <ActivityIndicator color="#6B8F71" />}
        </View>

        {reflection && (
          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-6 mb-6">
            <Text className="text-sand-400 text-xs uppercase tracking-wider mb-3">
              Miroir créatif
            </Text>
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
            disabled={saved}
          />
          <PrimaryButton
            label="Nouveau rituel"
            onPress={handleNewRitual}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
