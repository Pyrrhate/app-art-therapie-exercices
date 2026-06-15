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
import {
  startRitualFromColors,
  startRitualFromImpulse,
} from "@/lib/fil/bridges";
import { LOTUS_SOURCE } from "@/lib/nuance-finder/elements";
import {
  createNuanceGrid,
  findCell,
  flattenGrid,
  GRID_SIZE,
} from "@/lib/nuance-finder/grid";
import type { NuanceCell } from "@/lib/nuance-finder/types";

const UNREVEALED_COLOR = "#FAF7F4";
const UNREVEALED_BORDER = "#E8E0D8";
const LOTUS_WAVE_MS = 130;
const GRID_MAX_WIDTH = 420;
const CELL_GAP = 5;

interface NuanceCellViewProps {
  cell: NuanceCell;
  cellSize: number;
  revealed: boolean;
  lotusCleared: boolean;
  pebbled: boolean;
  onReveal: (id: string) => void;
  onTogglePebble: (id: string) => void;
}

function NuanceCellView({
  cell,
  cellSize,
  revealed,
  lotusCleared,
  pebbled,
  onReveal,
  onTogglePebble,
}: NuanceCellViewProps) {
  const opacity = useSharedValue(revealed ? 1 : 0);
  const scale = useSharedValue(revealed && cell.isSource ? 0.72 : 1);

  const displayColor = lotusCleared ? LOTUS_SOURCE.clearColor : cell.revealColor;

  useEffect(() => {
    if (revealed || lotusCleared) {
      const delay = lotusCleared && !cell.isSource ? 80 : 0;
      opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
      if (cell.isSource) {
        scale.value = withDelay(
          delay,
          withSpring(1, { damping: 12, stiffness: 110 })
        );
      } else if (lotusCleared) {
        scale.value = withDelay(delay, withTiming(1, { duration: 500 }));
      }
    } else {
      opacity.value = 0;
      scale.value = cell.isSource ? 0.72 : 1;
    }
  }, [revealed, lotusCleared, cell.isSource, opacity, scale]);

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
        marginRight: CELL_GAP,
        marginBottom: CELL_GAP,
      }}
      accessibilityRole="button"
      accessibilityLabel={cell.kind === "lotus" ? "Lotus" : "Case"}
    >
      <View
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: UNREVEALED_COLOR,
          borderWidth: 1,
          borderColor: revealed || lotusCleared ? "transparent" : UNREVEALED_BORDER,
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
              backgroundColor: displayColor,
              borderRadius,
            },
            colorStyle,
          ]}
        />

        {pebbled && !revealed && !lotusCleared && (
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
  const gridWidth = Math.min(GRID_MAX_WIDTH, windowWidth - 48);
  const cellSize = Math.floor(
    (gridWidth - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE
  );

  const [gameSeed, setGameSeed] = useState(() => Date.now());
  const grid = useMemo(() => createNuanceGrid(gameSeed), [gameSeed]);
  const flatCells = useMemo(() => flattenGrid(grid), [grid]);
  const lotusTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [lotusCleared, setLotusCleared] = useState<Record<string, boolean>>({});
  const [pebbles, setPebbles] = useState<Record<string, boolean>>({});

  useEffect(
    () => () => {
      lotusTimers.current.forEach(clearTimeout);
    },
    []
  );

  const revealedOrClearedCount = flatCells.filter(
    (c) => revealed[c.id] || lotusCleared[c.id]
  ).length;
  const harmonyFound = revealedOrClearedCount >= flatCells.length;

  const revealedColors = useMemo(() => {
    const hexes = new Set<string>();
    for (const cell of flatCells) {
      if (revealed[cell.id] || lotusCleared[cell.id]) {
        hexes.add(cell.revealColor);
      }
    }
    return [...hexes].slice(0, 5);
  }, [flatCells, revealed, lotusCleared]);

  const triggerLotusWave = useCallback(
    (lotusId: string) => {
      lotusTimers.current.forEach(clearTimeout);
      lotusTimers.current = [];

      grid.lotusZoneIds.forEach((zoneId, index) => {
        const timer = setTimeout(() => {
          setLotusCleared((prev) => ({ ...prev, [zoneId]: true }));
          setRevealed((prev) => ({ ...prev, [zoneId]: true }));
        }, index * LOTUS_WAVE_MS);
        lotusTimers.current.push(timer);
      });

      void lotusId;
    },
    [grid.lotusZoneIds]
  );

  const handleReveal = useCallback(
    (id: string) => {
      if (revealed[id] && !lotusCleared[id]) return;

      const cell = findCell(grid, id);
      if (!cell) return;

      setRevealed((prev) => ({ ...prev, [id]: true }));

      if (cell.kind === "lotus") {
        triggerLotusWave(id);
      }
    },
    [grid, revealed, lotusCleared, triggerLotusWave]
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
    setLotusCleared({});
    setPebbles({});
  }

  return (
    <View className="flex-1">
      <Text className="text-sand-500 text-sm leading-6 mb-4">
        Grille 8×8 — touchez les cases pour révéler les teintes. Un lotus 🪷
        peut apaiser une zone. Appui long : poser un galet.
      </Text>

      <View
        className="self-center mb-6"
        style={{
          width: cellSize * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1),
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {flatCells.map((cell) => (
          <NuanceCellView
            key={cell.id}
            cell={cell}
            cellSize={cellSize}
            revealed={Boolean(revealed[cell.id])}
            lotusCleared={Boolean(lotusCleared[cell.id])}
            pebbled={Boolean(pebbles[cell.id])}
            onReveal={handleReveal}
            onTogglePebble={handleTogglePebble}
          />
        ))}
      </View>

      {!harmonyFound && (
        <PrimaryButton
          label="Nouvelle grille"
          onPress={handleRestart}
          variant="ghost"
        />
      )}

      {harmonyFound && (
        <View className="gap-4 mb-4">
          <CreativeBridge
            title="Prolonger l'harmonie"
            subtitle="Notez cette palette ou amorcez un rituel."
            actions={[
              {
                label: "Noter pour un rituel d'écriture",
                onPress: () =>
                  startRitualFromColors(revealedColors, "Harmonie chromatique"),
              },
              {
                label: "Rituel libre à partir des teintes",
                onPress: () =>
                  startRitualFromImpulse(
                    `Harmonie de nuances : ${revealedColors.join(", ")}`,
                    "mixed_media"
                  ),
                variant: "ghost",
              },
            ]}
          />
          <AddToFilBar
            entry={{
              source: "nuances",
              summary: "Harmonie chromatique trouvée",
              detail: `${flatCells.length} cases révélées`,
              metadata: { colors: revealedColors },
            }}
          />
          <Text className="text-sage-600 text-xl font-light tracking-wide text-center pt-2">
            Harmonie trouvée
          </Text>
          <PrimaryButton label="Recommencer" onPress={handleRestart} />
        </View>
      )}
    </View>
  );
}
