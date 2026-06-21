import { Platform } from "react-native";
import { readBackupFileFromUri } from "./export";

export async function pickBackupFileContents(): Promise<string | null> {
  if (Platform.OS === "web") {
    return pickBackupOnWeb();
  }
  return pickBackupOnNative();
}

function pickBackupOnWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json,.art-therapie.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

async function pickBackupOnNative(): Promise<string | null> {
  try {
    const DocumentPicker = await import("expo-document-picker");
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "public.json"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    return readBackupFileFromUri(result.assets[0].uri);
  } catch {
    throw new Error(
      "Sélection de fichier indisponible. Réinstallez l'application ou utilisez la version web."
    );
  }
}
