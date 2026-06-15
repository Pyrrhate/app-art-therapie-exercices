import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { buildRakePaths } from "./rake";
import {
  DEFAULT_SAND_COLOR,
  RAKE_LINE_COLOR,
  ROCK_VARIANTS,
  ZEN_VIEWBOX,
  type ZenGardenState,
} from "./types";

function rockSvg(rock: ZenGardenState["rocks"][number]): string {
  const spec = ROCK_VARIANTS[rock.variant];
  const shadow = `<ellipse cx="${rock.x + 3}" cy="${rock.y + 5}" rx="${spec.rx * 0.9}" ry="${spec.ry * 0.5}" fill="rgba(80,70,60,0.15)"/>`;
  const body = `<ellipse cx="${rock.x}" cy="${rock.y}" rx="${spec.rx}" ry="${spec.ry}" fill="#5C5650" stroke="#4A4540" stroke-width="1.2"/>`;
  const highlight = `<ellipse cx="${rock.x - spec.rx * 0.25}" cy="${rock.y - spec.ry * 0.2}" rx="${spec.rx * 0.35}" ry="${spec.ry * 0.25}" fill="rgba(255,255,255,0.12)"/>`;
  return shadow + body + highlight;
}

export function buildZenGardenSvgString(state: ZenGardenState): string {
  const sand = state.sandColor || DEFAULT_SAND_COLOR;
  const rakePaths = state.strokes.flatMap((s) => buildRakePaths(s.points));
  const rakeSvg = rakePaths
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${RAKE_LINE_COLOR}" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`
    )
    .join("\n");
  const rocksSvg = state.rocks.map(rockSvg).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ZEN_VIEWBOX} ${ZEN_VIEWBOX}" width="1200" height="1200">
<rect width="100%" height="100%" fill="${sand}"/>
<rect x="8" y="8" width="384" height="384" rx="12" fill="none" stroke="#D4C4B5" stroke-width="1"/>
${rakeSvg}
${rocksSvg}
</svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function svgToCanvas(svgString: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;
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

export async function exportZenGarden(
  state: ZenGardenState
): Promise<{ uri?: string; message: string }> {
  const svgString = buildZenGardenSvgString(state);
  const filename = `jardin-zen-${Date.now()}.png`;

  if (Platform.OS === "web") {
    const canvas = await svgToCanvas(svgString);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export PNG échoué"))),
        "image/png",
        1
      );
    });
    downloadBlob(blob, filename);
    return { message: "PNG téléchargé (1200×1200 px)." };
  }

  const uri = `${FileSystem.cacheDirectory}${filename.replace(".png", ".svg")}`;
  await FileSystem.writeAsStringAsync(uri, svgString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  try {
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "image/svg+xml",
        dialogTitle: "Exporter votre jardin zen",
      });
      return { uri, message: "Jardin partagé — ouvrez-le pour imprimer." };
    }
  } catch {
    /* optionnel */
  }

  return { uri, message: `SVG enregistré : ${uri}` };
}
