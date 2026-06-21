import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PrimaryButton } from "@/components/ui/Button";
import { recordFilEntry } from "@/lib/fil/record";
import type { ColorForImpulse } from "@/lib/color-names";
import { LOTUS_SOURCE } from "@/lib/nuance-finder/elements";
import {
  createNuanceGrid,
  findCell,
  findLotus,
  flattenGrid,
  GRID_SIZE,
  LOTUS_COUNT,
} from "@/lib/nuance-finder/grid";
import type { NuanceCell } from "@/lib/nuance-finder/types";
import { textMuted, textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import { startRitualFromColors } from "@/lib/fil/bridges";

const UNREVEALED_COLOR = "#EEF0E6";
const LOTUS_WAVE_MS = 85;
const GRID_MAX_WIDTH = 520;
const CELL_GAP = 8;
const HORIZONTAL_PADDING = 48;

const gridCardShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 24px 60px -30px rgba(73, 99, 73, 0.35)" } as const)
    : undefined;

interface NuanceCellViewProps {
  cell: NuanceCell;
  cellSize: number;
  revealed: boolean;
  waveDelayMs: number;
  pebbled: boolean;
  onReveal: (id: string) => void;
  onTogglePebble: (id: string) => void;
}

function NuanceCellView({
  cell,
  cellSize,
  revealed,
  waveDelayMs,
  pebbled,
  onReveal,
  onTogglePebble,
}: NuanceCellViewProps) {
  const opacity = useSharedValue(revealed ? 1 : 0);
  const scale = useSharedValue(revealed ? 1 : cell.isSource ? 0.75 : 0.88);

  useEffect(() => {
    if (revealed) {
      opacity.value = withDelay(waveDelayMs, withTiming(1, { duration: 500 }));
      scale.value = withDelay(
        waveDelayMs,
        withSpring(1, { damping: 11, stiffness: 140, mass: 0.75 })
      );
    } else {
      opacity.value = 0;
      scale.value = cell.isSource ? 0.75 : 0.88;
    }
  }, [revealed, waveDelayMs, cell.isSource, opacity, scale]);

  const colorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const borderRadius = 16;
  const showLotusIcon = revealed && cell.kind === "lotus";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onReveal(cell.id)}
      onLongPress={() => onTogglePebble(cell.id)}
      delayLongPress={320}
      style={{ width: cellSize, height: cellSize }}
      accessibilityRole="button"
      accessibilityLabel={cell.kind === "lotus" ? "Lotus caché" : "Case"}
    >
      <View
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: UNREVEALED_COLOR,
          borderRadius,
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: cell.revealColor,
              borderRadius,
            },
            colorStyle,
          ]}
        />

        {pebbled && !revealed && (
          <View className="absolute inset-0 items-center justify-center">
            <View
              className="rounded-full bg-sand-500/35"
              style={{ width: 8, height: 8 }}
            />
          </View>
        )}

        {showLotusIcon && (
          <View className="absolute inset-0 items-center justify-center">
            <Text style={{ fontSize: Math.max(18, cellSize * 0.42) }}>
              {LOTUS_SOURCE.icon}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function NuanceFinder() {
  const isDark = useIsDark();
  const { width: windowWidth } = useWindowDimensions();
  const gridWidth = Math.min(GRID_MAX_WIDTH, windowWidth - HORIZONTAL_PADDING);
  const cellSize = Math.max(
    28,
    Math.floor((gridWidth - CELL_GAP * (GRID_SIZE - 1) - 24) / GRID_SIZE)
  );
  const gridOuterWidth = cellSize * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1);

  const [gameSeed, setGameSeed] = useState(() => Date.now());
  const grid = useMemo(() => createNuanceGrid(gameSeed), [gameSeed]);
  const flatCells = useMemo(() => flattenGrid(grid), [grid]);
  const lotusTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [waveDelays, setWaveDelays] = useState<Record<string, number>>({});
  const [pebbles, setPebbles] = useState<Record<string, boolean>>({});
  const [foundLotusCount, setFoundLotusCount] = useState(0);
  const filRecordedRef = useRef(false);

  useEffect(
    () => () => {
      lotusTimers.current.forEach(clearTimeout);
    },
    []
  );

  const revealedCount = flatCells.filter((c) => revealed[c.id]).length;
  const harmonyFound = revealedCount >= flatCells.length;

  const revealedColorItems = useMemo((): ColorForImpulse[] => {
    const items: ColorForImpulse[] = [];
    const seen = new Set<string>();
    for (const cell of flatCells) {
      if (!revealed[cell.id]) continue;
      const hex = cell.revealColor.toUpperCase();
      if (seen.has(hex)) continue;
      seen.add(hex);
      if (cell.kind === "lotus") {
        items.push({ hex, label: LOTUS_SOURCE.label });
      } else if (cell.source?.label) {
        items.push({ hex, label: cell.source.label });
      } else {
        items.push(hex);
      }
    }
    return items.slice(0, 5);
  }, [flatCells, revealed]);

  function recordNuanceFil() {
    if (filRecordedRef.current) return;
    filRecordedRef.current = true;
    void recordFilEntry({
      source: "nuances",
      summary: "Harmonie chromatique trouvée",
      detail: `${flatCells.length} cases · ${foundLotusCount} lotus`,
      metadata: {
        colors: revealedColorItems.map((c) =>
          typeof c === "string" ? c : c.hex
        ),
      },
    });
  }

  useEffect(() => {
    if (revealedCount >= 6) recordNuanceFil();
  }, [revealedCount, foundLotusCount, flatCells.length, revealedColorItems]);

  function handlePasserAExercice() {
    recordNuanceFil();
    startRitualFromColors(revealedColorItems, "Harmonie chromatique");
  }

  const triggerLotusWave = useCallback(
    (lotusId: string) => {
      const lotus = findLotus(grid, lotusId);
      if (!lotus) return;

      lotusTimers.current.forEach(clearTimeout);
      lotusTimers.current = [];

      lotus.zoneIds.forEach((zoneId, index) => {
        const timer = setTimeout(() => {
          setRevealed((prev) =>
            prev[zoneId] ? prev : { ...prev, [zoneId]: true }
          );
          setWaveDelays((prev) =>
            prev[zoneId] !== undefined
              ? prev
              : { ...prev, [zoneId]: index * LOTUS_WAVE_MS }
          );
        }, index * LOTUS_WAVE_MS);
        lotusTimers.current.push(timer);
      });

      setFoundLotusCount((count) => count + 1);
    },
    [grid]
  );

  const handleReveal = useCallback(
    (id: string) => {
      if (revealed[id]) return;

      const cell = findCell(grid, id);
      if (!cell) return;

      setRevealed((prev) => ({ ...prev, [id]: true }));
      setWaveDelays((prev) => ({ ...prev, [id]: 0 }));

      if (cell.kind === "lotus") {
        triggerLotusWave(id);
      }
    },
    [grid, revealed, triggerLotusWave]
  );

  const handleTogglePebble = useCallback((id: string) => {
    setPebbles((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

  function handleRestart() {
    filRecordedRef.current = false;
    lotusTimers.current.forEach(clearTimeout);
    lotusTimers.current = [];
    setGameSeed(Date.now());
    setRevealed({});
    setWaveDelays({});
    setPebbles({});
    setFoundLotusCount(0);
  }

  return (
    <View className="flex-1">
      <View
        className={`rounded-2xl border px-5 py-4 mb-6 ${
          isDark
            ? "bg-sand-800/80 border-sand-700"
            : "bg-white/80 border-sand-200"
        }`}
      >
        <Text
          className={`text-[13px] leading-6 text-center ${textMuted(isDark)}`}
        >
          Touchez les cases pour révéler les teintes. {LOTUS_COUNT} lotus{" "}
          {LOTUS_SOURCE.icon} sont cachés : ils dévoilent les couleurs alentour
          en onde. Appui long : poser un galet.
        </Text>
      </View>

      <View
        className={`self-center rounded-3xl border p-3 mb-5 ${
          isDark ? "bg-sand-800/60 border-sand-700" : "bg-white/60 border-sand-200"
        }`}
        style={!isDark ? gridCardShadow : undefined}
      >
        <View
          style={{
            width: gridOuterWidth,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: CELL_GAP,
          }}
        >
          {flatCells.map((cell) => (
            <NuanceCellView
              key={cell.id}
              cell={cell}
              cellSize={cellSize}
              revealed={Boolean(revealed[cell.id])}
              waveDelayMs={waveDelays[cell.id] ?? 0}
              pebbled={Boolean(pebbles[cell.id])}
              onReveal={handleReveal}
              onTogglePebble={handleTogglePebble}
            />
          ))}
        </View>
      </View>

      {harmonyFound ? (
        <View className="gap-4 mb-6 items-center">
          <Text
            className={`font-display text-2xl text-center ${textPrimary(isDark)}`}
            style={{ letterSpacing: -0.3 }}
          >
            Harmonie trouvée
          </Text>
          {foundLotusCount > 0 && (
            <Text className={`text-sm text-center ${textMuted(isDark)}`}>
              {foundLotusCount} lotus {LOTUS_SOURCE.icon} découverts
            </Text>
          )}
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center justify-between gap-3 pt-1">
        <Text className={`text-sm ${textMuted(isDark)}`}>
          {revealedCount} / {flatCells.length} teintes révélées
        </Text>

        <View className="flex-row flex-wrap items-center gap-3">
          <PrimaryButton
            label="Nouvelle grille"
            onPress={handleRestart}
            variant="ghost"
            align="start"
          />
          <PrimaryButton
            label="Passer à l'exercice"
            onPress={handlePasserAExercice}
            align="start"
          />
        </View>
      </View>
    </View>
  );
}
