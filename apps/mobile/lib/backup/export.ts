import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { formatSessionDate } from "@/constants";
import i18n from "@/lib/i18n";
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
        dialogTitle: i18n.t("app:settings.backupShareDialog"),
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
      message: i18n.t("app:settings.backupDownloaded", { size: sizeLabel }),
      sizeLabel,
      filCount: backup.data.creativeFil.length,
    };
  }

  const uri = await shareOnNative(filename, json);
  return {
    message: i18n.t("app:settings.backupShared", { size: sizeLabel }),
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
    i18n.t("app:settings.backupConfirmTraces", { count: summary.filCount }),
    summary.hasDraft
      ? i18n.t("app:settings.backupConfirmDraftYes")
      : i18n.t("app:settings.backupConfirmDraftNo"),
    i18n.t("app:settings.backupConfirmExported", {
      date: formatSessionDate(summary.exportedAt),
    }),
    i18n.t("app:settings.backupConfirmSize", { size: summary.sizeLabel }),
    "",
    i18n.t("app:settings.backupConfirmReplace"),
  ];
  return lines.join("\n");
}
