import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { MEDIA_TYPE_CONFIG } from "@/lib/multimodal/mediaConfig";
import type { ExpressionMediaType, MultimodalMediaFile } from "@/lib/multimodal/types";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface MultimodalDropzoneProps {
  mediaType: ExpressionMediaType;
  file: MultimodalMediaFile | null;
  busy?: boolean;
  error?: string | null;
  onFileSelected: (file: MultimodalMediaFile) => void;
  onClear: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MultimodalDropzone({
  mediaType,
  file,
  busy = false,
  error,
  onFileSelected,
  onClear,
}: MultimodalDropzoneProps) {
  const isDark = useIsDark();
  const config = MEDIA_TYPE_CONFIG[mediaType];
  const dropRef = useRef<View>(null);
  const webInputRef = useRef<HTMLInputElement | null>(null);

  const processWebFile = useCallback(
    async (raw: File) => {
      const uri = URL.createObjectURL(raw);
      let payload: string | undefined;
      if (mediaType === "visual") {
        payload = await fileToDataUrl(raw);
      }
      onFileSelected({
        name: raw.name,
        uri,
        mimeType: raw.type || "application/octet-stream",
        sizeBytes: raw.size,
        payload,
      });
    },
    [mediaType, onFileSelected]
  );

  const bindWebDrop = useCallback(
    (node: View | null) => {
      if (Platform.OS !== "web" || !node) return;
      const el = node as unknown as HTMLElement;
      if (el.dataset.dropBound === "1") return;
      el.dataset.dropBound = "1";

      const prevent = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      el.addEventListener("dragenter", prevent);
      el.addEventListener("dragover", prevent);
      el.addEventListener("drop", (e) => {
        prevent(e);
        const dropped = e.dataTransfer?.files?.[0];
        if (dropped) void processWebFile(dropped);
      });
    },
    [processWebFile]
  );

  async function pickNative() {
    if (mediaType === "visual") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      onFileSelected({
        name: asset.fileName ?? "photo.jpg",
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        sizeBytes: asset.fileSize ?? 0,
        payload: asset.base64
          ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
          : undefined,
      });
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type:
        mediaType === "corporeal"
          ? ["video/mp4", "video/quicktime"]
          : ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    onFileSelected({
      name: asset.name,
      uri: asset.uri,
      mimeType: asset.mimeType ?? "application/octet-stream",
      sizeBytes: asset.size ?? 0,
    });
  }

  function openPicker() {
    if (busy) return;
    if (Platform.OS === "web") {
      if (!webInputRef.current) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = config.acceptWeb;
        input.style.display = "none";
        input.addEventListener("change", () => {
          const f = input.files?.[0];
          if (f) void processWebFile(f);
          input.value = "";
        });
        document.body.appendChild(input);
        webInputRef.current = input;
      }
      webInputRef.current.click();
      return;
    }
    void pickNative();
  }

  const borderClass = error
    ? "border-red-300"
    : isDark
      ? "border-sand-600 border-dashed"
      : "border-sand-300 border-dashed";

  return (
    <View className="gap-3">
      <Pressable
        ref={(node) => {
          dropRef.current = node;
          bindWebDrop(node);
        }}
        onPress={openPicker}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Zone de dépôt — ${config.title}. ${config.dropHint}`}
        className={`rounded-2xl border-2 ${borderClass} px-6 py-10 items-center justify-center min-h-[200px] ${
          isDark ? "bg-sand-800/40" : "bg-sand-50"
        } ${Platform.OS === "web" ? "web:cursor-pointer web:hover:bg-sand-100/80 web:transition-colors" : ""}`}
      >
        {busy ? (
          <ActivityIndicator color="#496349" size="large" />
        ) : file && mediaType === "visual" ? (
          <Image
            source={{ uri: file.uri }}
            className="w-full max-h-48 rounded-xl"
            resizeMode="contain"
            accessibilityLabel="Aperçu de votre création visuelle"
          />
        ) : (
          <>
            <Text
              accessibilityLabel={config.iconLabel}
              className="text-sage-500 text-4xl mb-3"
            >
              {config.icon}
            </Text>
            <Text className={`text-sm font-medium text-center ${textPrimary(isDark)}`}>
              {config.dropHint}
            </Text>
            <Text className={`text-xs text-center mt-2 ${textMuted(isDark)}`}>
              {config.extensions.join(" · ")}
            </Text>
          </>
        )}
      </Pressable>

      {file ? (
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className={`text-sm font-medium ${textPrimary(isDark)}`} numberOfLines={1}>
              {file.name}
            </Text>
            <Text className={`text-xs ${textMuted(isDark)}`}>
              {formatSize(file.sizeBytes)}
            </Text>
          </View>
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retirer le fichier sélectionné"
          >
            <Text className="text-sage-500 text-sm">Retirer</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <Text className="text-red-600 text-sm" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Text className={`text-xs leading-5 ${textSecondary(isDark)}`}>
        Votre fichier reste sur cet appareil jusqu'à l'envoi pour l'analyse. Formats
        acceptés selon le type d'expression choisi.
      </Text>
    </View>
  );
}
