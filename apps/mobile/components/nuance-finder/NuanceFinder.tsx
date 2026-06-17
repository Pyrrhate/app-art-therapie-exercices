import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PrimaryButton } from "@/components/ui/Button";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { startRitualFromColors } from "@/lib/fil/bridges";
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

const UNREVEALED_COLOR = "#FAF7F4";
const UNREVEALED_BORDER = "#E8E0D8";
const LOTUS_WAVE_MS = 85;
const GRID_MAX_WIDTH = 420;
const CELL_GAP = 4;
const HORIZONTAL_PADDING = 56;

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
      opacity.value = withDelay(
        waveDelayMs,
        withTiming(1, { duration: 380 })
      );
      scale.value = withDelay(
        waveDelayMs,
        withSpring(1, {
          damping: 11,
          stiffness: 140,
          mass: 0.75,
        })
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

  const borderRadius = Math.max(8, cellSize * 0.2);
  const showLotusIcon = revealed && cell.kind === "lotus";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onReveal(cell.id)}
      onLongPress={() => onTogglePebble(cell.id)}
      delayLongPress={320}
      style={{
        width: cellSize,
        height: cellSize,
      }}
      accessibilityRole="button"
      accessibilityLabel={cell.kind === "lotus" ? "Lotus caché" : "Case"}
    >
      <View
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: UNREVEALED_COLOR,
          borderWidth: 1,
          borderColor: revealed ? "transparent" : UNREVEALED_BORDER,
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
              className="rounded-full bg-sand-500/40"
              style={{ width: 10, height: 10 }}
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
  const { width: windowWidth } = useWindowDimensions();
  const gridWidth = Math.min(GRID_MAX_WIDTH, windowWidth - HORIZONTAL_PADDING);
  const cellSize = Math.max(
    28,
    Math.floor((gridWidth - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE)
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

  const pebbleCount = Object.keys(pebbles).length;
  const canExitEarly =
    !harmonyFound &&
    (foundLotusCount >= 1 ||
      pebbleCount >= 2 ||
      revealedCount >= 6 ||
      revealedColorItems.length >= 3);

  function handlePasserAExercice() {
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
      <Text className="text-sand-500 text-sm leading-6 mb-4">
        Grille 8×8 — touchez les cases pour révéler les teintes.{" "}
        {LOTUS_COUNT} lotus 🪷 sont cachés : ils dévoilent les couleurs
        alentour en onde. Appui long : poser un galet. Passez à l&apos;exercice
        quand vous le souhaitez.
      </Text>

      {foundLotusCount > 0 && (
        <Text className="text-sage-600 text-xs text-center mb-3">
          Lotus trouvés : {foundLotusCount} / {LOTUS_COUNT}
        </Text>
      )}

      <View
        className="self-center mb-6"
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

      {canExitEarly && (
        <View className="gap-3 mb-4">
          <CreativeBridge
            title="Prêt à créer ?"
            subtitle="Vos teintes peuvent devenir une impulsion pour peindre — vous pouvez aussi continuer à explorer."
            actions={[
              {
                label: "Passer à l'exercice",
                onPress: handlePasserAExercice,
                variant: "primary",
              },
            ]}
          />
        </View>
      )}

      {!harmonyFound && (
        <PrimaryButton
          label="Nouvelle grille"
          onPress={handleRestart}
          variant="ghost"
        />
      )}

      {harmonyFound && (
        <View className="gap-4 mb-4">
          <Text className="text-sage-600 text-xl font-light tracking-wide text-center">
            Harmonie trouvée
          </Text>

          <CreativeBridge
            title="Votre impulsion est prête"
            subtitle="Vos teintes deviennent une impulsion pour peindre — l'exercice vous attend."
            actions={[
              {
                label: "Passer à l'exercice",
                onPress: handlePasserAExercice,
                variant: "primary",
              },
            ]}
          />
          <AddToFilBar
            entry={{
              source: "nuances",
              summary: "Harmonie chromatique trouvée",
              detail: `${flatCells.length} cases révélées · ${foundLotusCount} lotus`,
              metadata: {
                colors: revealedColorItems.map((c) =>
                  typeof c === "string" ? c : c.hex
                ),
              },
            }}
          />
          <PrimaryButton label="Recommencer" onPress={handleRestart} variant="ghost" />
        </View>
      )}
    </View>
  );
}
