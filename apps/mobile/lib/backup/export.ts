import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { formatSessionDate } from "@/constants";
import { buildAppBackup, formatBackupSize } from "./build";
import { BACKUP_FILE_EXTENSION } from "./types";

function backupFilename(exportedAt: string): string {
  const date = exportedAt.slice(0, 10);
  return `art-therapie-sauvegarde-${date}${BACKUP_FILE_EXTENSION}`;
}

function downloadOnWeb(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function shareOnNative(filename: string, contents: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  try {
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: "Exporter votre pratique",
        UTI: "public.json",
      });
      return uri;
    }
  } catch {
    /* partage optionnel */
  }

  return uri;
}

export async function exportAppBackup(): Promise<{
  message: string;
  sizeLabel: string;
  filCount: number;
}> {
  const backup = await buildAppBackup();
  const json = JSON.stringify(backup, null, 2);
  const filename = backupFilename(backup.exportedAt);
  const sizeLabel = formatBackupSize(json.length);

  if (Platform.OS === "web") {
    downloadOnWeb(filename, json);
    return {
      message: `Fichier téléchargé (${sizeLabel}) — conservez-le pour restaurer sur un autre appareil.`,
      sizeLabel,
      filCount: backup.data.creativeFil.length,
    };
  }

  const uri = await shareOnNative(filename, json);
  return {
    message: `Sauvegarde partagée (${sizeLabel}). Enregistrez le fichier dans vos fichiers ou Drive.`,
    sizeLabel,
    filCount: backup.data.creativeFil.length,
  };
}

export async function readBackupFileFromUri(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export function formatRestoreConfirmMessage(summary: {
  filCount: number;
  hasDraft: boolean;
  exportedAt: string;
  sizeLabel: string;
}): string {
  const lines = [
    `${summary.filCount} trace${summary.filCount > 1 ? "s" : ""} dans le Fil créatif`,
    summary.hasDraft ? "Brouillon de rituel inclus" : "Pas de brouillon en cours",
    `Exportée le ${formatSessionDate(summary.exportedAt)}`,
    `Taille : ${summary.sizeLabel}`,
    "",
    "Les données actuelles de cet appareil seront remplacées.",
  ];
  return lines.join("\n");
}
