import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { buildMandalaSvgString } from "./generator";
import type { MandalaFills, MandalaSpec } from "./types";
import { DEFAULT_MANDALA_FILL } from "./palette";

export type ExportFormat = "png" | "pdf";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function svgToCanvas(
  svgString: string,
  scale = 3
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400 * scale;
      canvas.height = 400 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponible"));
        return;
      }
      ctx.fillStyle = "#FAF7F4";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de charger le SVG"));
    };
    img.src = url;
  });
}

async function exportWebPng(svgString: string, filename: string): Promise<void> {
  const canvas = await svgToCanvas(svgString, 3);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export PNG échoué"))),
      "image/png",
      1
    );
  });
  downloadBlob(blob, filename);
}

function exportWebPdf(svgString: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup bloquée — autorisez les fenêtres pour exporter en PDF");
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html><head><title>Mandala</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { margin: 0; display: flex; justify-content: center; align-items: center; background: #FAF7F4; }
      svg { width: 100%; max-width: 180mm; height: auto; }
    </style></head>
    <body>${svgString.replace(/<\?xml[^?]*\?>/, "")}
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`);
  printWindow.document.close();
}

async function exportNativeSvg(svgString: string, filename: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, svgString, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

export async function exportMandala(
  spec: MandalaSpec,
  fills: MandalaFills,
  format: ExportFormat
): Promise<{ uri?: string; message: string }> {
  const svgString = buildMandalaSvgString(spec, fills, DEFAULT_MANDALA_FILL);
  const stamp = Date.now();
  const baseName = `mandala-${spec.theme}-${stamp}`;

  if (Platform.OS === "web") {
    if (format === "png") {
      await exportWebPng(svgString, `${baseName}.png`);
      return { message: "PNG téléchargé (1200×1200 px)." };
    }
    exportWebPdf(svgString);
    return { message: "Fenêtre d'impression ouverte — choisissez « Enregistrer en PDF »." };
  }

  const uri = await exportNativeSvg(svgString, `${baseName}.svg`);
  try {
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "image/svg+xml",
        dialogTitle: "Exporter votre mandala",
      });
      return { uri, message: "Fichier SVG partagé — ouvrez-le pour imprimer." };
    }
  } catch {
    /* expo-sharing optionnel */
  }
  return {
    uri,
    message: `SVG enregistré : ${uri}`,
  };
}
