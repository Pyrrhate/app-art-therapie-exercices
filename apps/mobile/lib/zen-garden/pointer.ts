import { Platform, type GestureResponderEvent } from "react-native";
import { clampToViewBox } from "./geometry";
import type { ZenPoint } from "./types";

export interface GardenLayout {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

type NativeTouch = GestureResponderEvent["nativeEvent"] & {
  pageX?: number;
  pageY?: number;
  clientX?: number;
  clientY?: number;
};

/** Coordonnées locales fiables (Pressable web renvoie souvent 0,0). */
export function getEventGardenPoint(
  event: GestureResponderEvent,
  layout: GardenLayout | null,
  canvasWidth: number,
  canvasHeight: number
): ZenPoint {
  const ne = event.nativeEvent as NativeTouch;
  let localX = ne.locationX;
  let localY = ne.locationY;

  const needsFallback =
    layout &&
    (localX == null ||
      localY == null ||
      Number.isNaN(localX) ||
      Number.isNaN(localY) ||
      (Platform.OS === "web" && localX === 0 && localY === 0));

  if (needsFallback && layout) {
    const pageX = ne.pageX ?? ne.clientX ?? 0;
    const pageY = ne.pageY ?? ne.clientY ?? 0;
    localX = pageX - layout.pageX;
    localY = pageY - layout.pageY;
  }

  return clampToViewBox(localX ?? 0, localY ?? 0, canvasWidth, canvasHeight);
}

export function measureGardenLayout(
  node: ViewLike | null,
  callback: (layout: GardenLayout) => void
): void {
  if (!node?.measureInWindow) return;
  node.measureInWindow((pageX, pageY, width, height) => {
    callback({ pageX, pageY, width, height });
  });
}

interface ViewLike {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
}
