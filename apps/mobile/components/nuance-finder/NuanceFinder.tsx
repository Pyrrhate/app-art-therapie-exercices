import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PrimaryButton } from "@/components/ui/Button";
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

interface NuanceCellViewProps {
  cell: NuanceCell;
  revealed: boolean;
  lotusCleared: boolean;
  pebbled: boolean;
  onReveal: (id: string) => void;
  onTogglePebble: (id: string) => void;
}

function NuanceCellView({
  cell,
  revealed,
  lotusCleared,
  pebbled,
  onReveal,
  onTogglePebble,
}: NuanceCellViewProps) {
  const opacity = useSharedValue(revealed ? 1 : 0);
  const scale = useSharedValue(
    revealed && (cell.isSource || lotusCleared) ? 0.72 : 1
  );

  const displayColor = lotusCleared ? LOTUS_SOURCE.clearColor : cell.revealColor;

  useEffect(() => {
    if (revealed || lotusCleared) {
      const delay = lotusCleared && !cell.isSource ? 80 : 0;
      opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
      if (cell.kind === "lotus" || cell.kind === "element" || cell.kind === "primary") {
        scale.value = withDelay(
          delay,
          withSpring(1, { damping: 14, stiffness: 120 })
        );
      } else if (lotusCleared) {
        scale.value = withDelay(delay, withTiming(1, { duration: 500 }));
      }
    } else {
      opacity.value = 0;
      scale.value = cell.isSource ? 0.72 : 1;
    }
  }, [revealed, lotusCleared, cell.isSource, cell.kind, opacity, scale]);

  const colorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const label =
    cell.kind === "lotus"
      ? "Lotus"
      : cell.kind === "element"
        ? cell.elementKind
        : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onReveal(cell.id)}
      onLongPress={() => onTogglePebble(cell.id)}
      delayLongPress={320}
      className="p-0.5"
      style={{ width: `${100 / GRID_SIZE}%`, aspectRatio: 1 }}
      accessibilityRole="button"
    >
      <View
        className="flex-1 rounded-xl overflow-hidden"
        style={{
          backgroundColor: UNREVEALED_COLOR,
          borderWidth: 1,
          borderColor: revealed || lotusCleared ? "transparent" : UNREVEALED_BORDER,
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
              borderRadius: 12,
            },
            colorStyle,
          ]}
        />
        {pebbled && !revealed && !lotusCleared && (
          <View className="absolute inset-0 items-center justify-center">
            <View
              className="rounded-full bg-sand-500/35"
              style={{ width: 8, height: 8 }}
            />
          </View>
        )}
        {revealed && cell.kind === "lotus" && (
          <View className="absolute inset-0 items-center justify-center">
            <Text style={{ fontSize: 16 }}>🪷</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function NuanceFinder() {
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
      setRevealed((prev) => ({ ...prev, [id]: true }));

      if (cell?.kind === "lotus") {
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
      <Text className="text-sand-500 text-sm leading-6 mb-6">
        Quatre éléments (terre, feu, eau, air) colorent leur voisinage. Un lotus
        caché apaise une zone autour de lui. Appui long : poser un galet.
      </Text>

      <View className="flex-row flex-wrap mx-auto w-full max-w-[360px] mb-6">
        {flatCells.map((cell) => (
          <NuanceCellView
            key={cell.id}
            cell={cell}
            revealed={Boolean(revealed[cell.id])}
            lotusCleared={Boolean(lotusCleared[cell.id])}
            pebbled={Boolean(pebbles[cell.id])}
            onReveal={handleReveal}
            onTogglePebble={handleTogglePebble}
          />
        ))}
      </View>

      {harmonyFound && (
        <View className="items-center gap-4 mb-4">
          <Text className="text-sage-600 text-xl font-light tracking-wide">
            Harmonie trouvée
          </Text>
          <PrimaryButton label="Recommencer" onPress={handleRestart} />
        </View>
      )}

      {!harmonyFound && (
        <PrimaryButton
          label="Nouvelle grille"
          onPress={handleRestart}
          variant="ghost"
        />
      )}
    </View>
  );
}
