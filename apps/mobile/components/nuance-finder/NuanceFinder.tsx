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
  flattenGrid,
  GRID_SIZE,
} from "@/lib/nuance-finder/grid";
import type { NuanceCell } from "@/lib/nuance-finder/types";

const UNREVEALED_COLOR = "#FAF7F4";
const UNREVEALED_BORDER = "#E8E0D8";
const LOTUS_WAVE_MS = 130;
const GRID_MAX_WIDTH = 420;
const CELL_GAP = 4;
const HORIZONTAL_PADDING = 56;

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

  const revealedColorItems = useMemo((): ColorForImpulse[] => {
    const items: ColorForImpulse[] = [];
    const seen = new Set<string>();
    for (const cell of flatCells) {
      if (!revealed[cell.id] && !lotusCleared[cell.id]) continue;
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
  }, [flatCells, revealed, lotusCleared]);

  const lotusUnlocked =
    Object.keys(lotusCleared).length > 0 ||
    flatCells.some((c) => c.kind === "lotus" && revealed[c.id]);
  const pebbleCount = Object.keys(pebbles).length;
  const canExitEarly =
    !harmonyFound &&
    (lotusUnlocked ||
      pebbleCount >= 2 ||
      revealedOrClearedCount >= 6 ||
      revealedColorItems.length >= 3);

  function handlePasserAExercice() {
    startRitualFromColors(revealedColorItems, "Harmonie chromatique");
  }

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
        Grille 8×8 — touchez les cases pour révéler les teintes. Le lotus 🪷
        apaise une zone autour de lui. Appui long : poser un galet. Quand vous
        le souhaitez, passez à l&apos;exercice.
      </Text>

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
            lotusCleared={Boolean(lotusCleared[cell.id])}
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
              detail: `${flatCells.length} cases révélées`,
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
