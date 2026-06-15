import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import {
  buildSandPatchPath,
  buildWaterPath,
} from "./geometry";
import {
  DEFAULT_SAND_COLOR,
  GROUND_Y,
  PEBBLE_VARIANTS,
  SAND_STROKE_COLOR,
  SKY_COLOR,
  SOIL_COLOR,
  SOIL_BOTTOM,
  SOIL_TOP,
  WATER_COLOR,
  WATER_OPACITY,
  ZEN_VIEWBOX_HEIGHT,
  ZEN_VIEWBOX_WIDTH,
  type ZenGardenState,
  type ZenPebble,
} from "./types";

const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = Math.round(EXPORT_WIDTH * (ZEN_VIEWBOX_HEIGHT / ZEN_VIEWBOX_WIDTH));

function pebbleSvg(pebble: ZenPebble): string {
  const spec = PEBBLE_VARIANTS[pebble.variant];
  const shadow = `<ellipse cx="${pebble.x + 2}" cy="${pebble.y + 4}" rx="${spec.rx * 0.85}" ry="${spec.ry * 0.35}" fill="rgba(80,70,60,0.18)"/>`;
  const body = `<ellipse cx="${pebble.x}" cy="${pebble.y}" rx="${spec.rx}" ry="${spec.ry}" fill="#5C5650" stroke="#4A4540" stroke-width="1.1"/>`;
  const highlight = `<ellipse cx="${pebble.x - spec.rx * 0.22}" cy="${pebble.y - spec.ry * 0.25}" rx="${spec.rx * 0.32}" ry="${spec.ry * 0.22}" fill="rgba(255,255,255,0.14)"/>`;
  return shadow + body + highlight;
}

export function buildZenGardenSvgString(state: ZenGardenState): string {
  const sand = state.sandColor || DEFAULT_SAND_COLOR;
  const sandPaths = state.sandPatches
    .map((patch) => buildSandPatchPath(patch.points))
    .filter(Boolean)
    .map(
      (d) =>
        `<path d="${d}" fill="${sand}" stroke="${SAND_STROKE_COLOR}" stroke-width="0.8" opacity="0.95"/>`
    )
    .join("\n");

  const waterSvg = state.waterBodies
    .map((body) => {
      const d = buildWaterPath(body.x, body.y, body.width, body.height);
      const wave = buildWaterPath(body.x, body.y, body.width, body.height);
      return `<path d="${d}" fill="${WATER_COLOR}" opacity="${WATER_OPACITY}"/><path d="${wave}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>`;
    })
    .join("\n");

  const pebblesSvg = state.pebbles.map(pebbleSvg).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ZEN_VIEWBOX_WIDTH} ${ZEN_VIEWBOX_HEIGHT}" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}">
<rect x="0" y="0" width="${ZEN_VIEWBOX_WIDTH}" height="${GROUND_Y}" fill="${SKY_COLOR}"/>
<rect x="0" y="${SOIL_TOP}" width="${ZEN_VIEWBOX_WIDTH}" height="${SOIL_BOTTOM - SOIL_TOP}" fill="${SOIL_COLOR}"/>
<line x1="0" y1="${GROUND_Y}" x2="${ZEN_VIEWBOX_WIDTH}" y2="${GROUND_Y}" stroke="#8B7355" stroke-width="0.6" opacity="0.5"/>
${sandPaths}
${waterSvg}
${pebblesSvg}
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
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponible"));
        return;
      }
      ctx.fillStyle = SKY_COLOR;
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
    return { message: `PNG téléchargé (${EXPORT_WIDTH}×${EXPORT_HEIGHT} px).` };
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
