import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { View } from "react-native";
import type { ArtisticTechnique } from "@/lib/types";
import type { MandalaTheme } from "@/lib/mandala/types";

export type ModuleIconId =
  | "ping-pong"
  | "color-journey"
  | "emotion-explorer"
  | "nuance-finder";

export type PastekIconId =
  | ModuleIconId
  | "ritual"
  | "mandala"
  | "zen-garden"
  | "lotus"
  | "mandala-calm"
  | "mandala-energy"
  | "mandala-focus"
  | ArtisticTechnique;

const MINT = "#E3EDE5";
const BEIGE = "#F0EBE4";

const ICON_BG: Record<string, string> = {
  "ping-pong": MINT,
  "color-journey": BEIGE,
  "emotion-explorer": MINT,
  "nuance-finder": BEIGE,
  ritual: BEIGE,
  mandala: MINT,
  "zen-garden": BEIGE,
  lotus: MINT,
  "mandala-calm": MINT,
  "mandala-energy": BEIGE,
  "mandala-focus": MINT,
  drawing: MINT,
  painting: BEIGE,
  writing: MINT,
  mixed_media: BEIGE,
  collage: MINT,
  volume: BEIGE,
  recyclart: MINT,
  video: BEIGE,
  music: MINT,
  dance: BEIGE,
  theatre: MINT,
};

const NUANCE_TILES = [
  "#E8DDD4",
  "#C4A484",
  "#D4C4B5",
  "#A8856A",
  "#F0EBE4",
  "#B8A090",
  "#C4A484",
  "#9A8070",
  "#D4C4B5",
  "#A8856A",
  "#E8DDD4",
  "#7A6558",
  "#C4A484",
  "#D4C4B5",
  "#B8A090",
  "#A8856A",
];

interface PastekIconProps {
  id: PastekIconId;
  size?: number;
  boxSize?: number;
  className?: string;
  tone?: "default" | "light";
}

export function filSourceToIcon(source: string): PastekIconId {
  const map: Record<string, PastekIconId> = {
    ritual: "ritual",
    mandala: "mandala",
    nuances: "nuance-finder",
    "ping-pong": "ping-pong",
    "color-journey": "color-journey",
    "emotion-explorer": "emotion-explorer",
    "zen-garden": "zen-garden",
  };
  return map[source] ?? "ritual";
}

export function mandalaThemeToIcon(theme: MandalaTheme): PastekIconId {
  return `mandala-${theme}` as PastekIconId;
}

function palette(tone: "default" | "light") {
  if (tone === "light") {
    return { p: "#FFFFFF", s: "rgba(255,255,255,0.75)", a: "rgba(255,255,255,0.55)" };
  }
  return { p: "#496349", s: "#8FA88A", a: "#A8856A" };
}

function IconGraphic({
  id,
  tone,
}: {
  id: PastekIconId;
  tone: "default" | "light";
}) {
  const { p, s, a } = palette(tone);

  switch (id) {
    case "ping-pong":
      return (
        <>
          <Circle cx="14" cy="20" r="8" fill={p} opacity={0.9} />
          <Circle cx="26" cy="20" r="8" fill={s} opacity={0.55} />
        </>
      );
    case "color-journey":
      return (
        <>
          <Circle cx="20" cy="20" r="12" fill="none" stroke={a} strokeWidth={2.5} />
          <Circle cx="20" cy="20" r="4.5" fill={a} />
        </>
      );
    case "emotion-explorer":
      return (
        <>
          {[
            [14, 14, 0.55],
            [26, 14, 0.75],
            [14, 26, 0.45],
            [26, 26, 0.65],
          ].map(([cx, cy, opacity]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" fill={s} opacity={opacity} />
          ))}
        </>
      );
    case "nuance-finder":
      return (
        <>
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <Rect
                key={`${row}-${col}`}
                x={8 + col * 7}
                y={8 + row * 7}
                width={5.5}
                height={5.5}
                rx={1}
                fill={tone === "light" ? s : NUANCE_TILES[row * 4 + col]!}
                opacity={tone === "light" ? 0.85 - col * 0.08 : 1}
              />
            ))
          )}
        </>
      );
    case "ritual":
      return (
        <>
          <Circle cx="20" cy="20" r="3.5" fill={p} />
          {[0, 45, 90, 135].map((deg) => (
            <Circle
              key={deg}
              cx={20 + Math.cos((deg * Math.PI) / 180) * 10}
              cy={20 + Math.sin((deg * Math.PI) / 180) * 10}
              r="2.2"
              fill={s}
              opacity={0.7}
            />
          ))}
        </>
      );
    case "mandala":
    case "mandala-calm":
      return (
        <>
          <Circle cx="20" cy="20" r="11" fill="none" stroke={s} strokeWidth={1.5} opacity={0.5} />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <Circle
              key={deg}
              cx={20 + Math.cos((deg * Math.PI) / 180) * 8}
              cy={20 + Math.sin((deg * Math.PI) / 180) * 8}
              r="3"
              fill={s}
              opacity={0.65}
            />
          ))}
          <Circle cx="20" cy="20" r="3" fill={p} />
        </>
      );
    case "mandala-energy":
      return (
        <Path
          d="M22 9 L17 20 L21 20 L18 31 L26 18 L21 18 L25 9 Z"
          fill={p}
          opacity={0.85}
        />
      );
    case "mandala-focus":
      return (
        <>
          <Circle cx="20" cy="20" r="11" fill="none" stroke={s} strokeWidth={2} />
          <Circle cx="20" cy="20" r="6.5" fill="none" stroke={a} strokeWidth={1.5} />
          <Circle cx="20" cy="20" r="2.5" fill={p} />
        </>
      );
    case "zen-garden":
      return (
        <>
          <Circle cx="29" cy="28" r="4" fill={a} opacity={0.85} />
          <Line x1="9" y1="14" x2="26" y2="14" stroke={s} strokeWidth={1.8} opacity={0.7} />
          <Line x1="9" y1="19" x2="24" y2="19" stroke={s} strokeWidth={1.8} opacity={0.55} />
          <Line x1="9" y1="24" x2="22" y2="24" stroke={s} strokeWidth={1.8} opacity={0.4} />
        </>
      );
    case "lotus":
      return (
        <>
          {[0, 72, 144, 216, 288].map((deg) => (
            <Circle
              key={deg}
              cx={20 + Math.cos(((deg - 90) * Math.PI) / 180) * 7}
              cy={20 + Math.sin(((deg - 90) * Math.PI) / 180) * 7}
              r="4.5"
              fill={s}
              opacity={0.6}
            />
          ))}
          <Circle cx="20" cy="20" r="3.5" fill={p} />
        </>
      );
    case "drawing":
      return (
        <Path
          d="M12 28 L28 12"
          stroke={p}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      );
    case "painting":
      return (
        <>
          <Circle cx="26" cy="14" r="5" fill={s} opacity={0.8} />
          <Path d="M11 30 Q14 18 22 16 L26 14" stroke={a} strokeWidth={2} fill="none" />
        </>
      );
    case "writing":
      return (
        <>
          <Line x1="11" y1="15" x2="29" y2="15" stroke={p} strokeWidth={2} strokeLinecap="round" />
          <Line x1="11" y1="21" x2="27" y2="21" stroke={s} strokeWidth={2} strokeLinecap="round" />
          <Line x1="11" y1="27" x2="24" y2="27" stroke={a} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "mixed_media":
      return (
        <>
          <Circle cx="16" cy="22" r="8" fill={p} opacity={0.75} />
          <Circle cx="26" cy="18" r="8" fill={s} opacity={0.5} />
        </>
      );
    case "collage":
      return (
        <>
          <Rect x="10" y="12" width="14" height="14" rx="2" fill={s} opacity={0.7} />
          <Rect x="18" y="16" width="14" height="14" rx="2" fill={p} opacity={0.8} />
        </>
      );
    case "volume":
      return (
        <Path
          d="M12 26 L20 12 L30 18 L22 32 Z"
          fill={s}
          opacity={0.65}
          stroke={p}
          strokeWidth={1.5}
        />
      );
    case "recyclart":
      return (
        <Path
          d="M14 12 L20 8 L26 12 L23 12 L25 22 L15 22 L17 12 Z M20 24 L17 28 L23 28 Z"
          fill={p}
          opacity={0.8}
        />
      );
    case "video":
      return (
        <>
          <Rect x="10" y="13" width="20" height="14" rx="3" fill="none" stroke={p} strokeWidth={2} />
          <Path d="M19 17 L26 20 L19 23 Z" fill={s} />
        </>
      );
    case "music":
      return (
        <>
          <Circle cx="15" cy="27" r="3.5" fill={p} />
          <Circle cx="25" cy="24" r="3.5" fill={s} />
          <Line x1="18.5" y1="27" x2="18.5" y2="14" stroke={p} strokeWidth={2} />
          <Line x1="28.5" y1="24" x2="28.5" y2="11" stroke={s} strokeWidth={2} />
        </>
      );
    case "dance":
      return (
        <Path
          d="M12 28 Q18 10 28 14 Q22 22 20 28"
          stroke={p}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
      );
    case "theatre":
      return (
        <>
          <Circle cx="15" cy="20" r="7" fill="none" stroke={s} strokeWidth={2} />
          <Circle cx="27" cy="20" r="7" fill="none" stroke={p} strokeWidth={2} />
        </>
      );
    default:
      return <Circle cx="20" cy="20" r="6" fill={s} />;
  }
}

export function PastekIcon({
  id,
  size = 36,
  boxSize = 48,
  className = "mb-4",
  tone = "default",
}: PastekIconProps) {
  const bg = tone === "light" ? "transparent" : (ICON_BG[id] ?? MINT);

  return (
    <View
      className={`rounded-xl items-center justify-center ${className}`}
      style={{
        width: boxSize,
        height: boxSize,
        backgroundColor: bg,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <IconGraphic id={id} tone={tone} />
      </Svg>
    </View>
  );
}

/** @deprecated Préférer PastekIcon */
export function ModuleIcon({ id, size = 36 }: { id: ModuleIconId; size?: number }) {
  return <PastekIcon id={id} size={size} />;
}

/** Icône lotus inline (texte du Chercheur de Nuances). */
export function LotusMark({ size = 14 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, marginHorizontal: 2 }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <IconGraphic id="lotus" tone="default" />
      </Svg>
    </View>
  );
}
