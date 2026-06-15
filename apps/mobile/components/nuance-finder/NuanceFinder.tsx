import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
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
import {
  ELEMENT_VISUALS,
  getElementNeighborIds,
  LOTUS_SOURCE,
} from "@/lib/nuance-finder/elements";
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
const ELEMENT_ICON_SIZE = 34;
const LOTUS_ICON_SIZE = 32;
const DEPLOY_ICON_SIZE = 22;

function ElementColorRings({
  colors,
  active,
  size,
}: {
  colors: string[];
  active: boolean;
  size: number;
}) {
  const ring0 = useSharedValue(0.35);
  const ring1 = useSharedValue(0.35);
  const ring2 = useSharedValue(0.35);
  const ring3 = useSharedValue(0.35);
  const op0 = useSharedValue(0);
  const op1 = useSharedValue(0);
  const op2 = useSharedValue(0);
  const op3 = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      ring0.value = 0.35;
      ring1.value = 0.35;
      ring2.value = 0.35;
      ring3.value = 0.35;
      op0.value = 0;
      op1.value = 0;
      op2.value = 0;
      op3.value = 0;
      return;
    }

    const rings = [
      { scale: ring0, opacity: op0, delay: 0 },
      { scale: ring1, opacity: op1, delay: 100 },
      { scale: ring2, opacity: op2, delay: 200 },
      { scale: ring3, opacity: op3, delay: 300 },
    ];

    rings.forEach(({ scale, opacity, delay }) => {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.85, { duration: 1100, easing: Easing.out(Easing.quad) }),
            withTiming(0.35, { duration: 0 })
          ),
          -1,
          false
        )
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.65, { duration: 550 }),
            withTiming(0.08, { duration: 550 })
          ),
          -1,
          false
        )
      );
    });
  }, [active, op0, op1, op2, op3, ring0, ring1, ring2, ring3]);

  const styles = [
    useAnimatedStyle(() => ({
      transform: [{ scale: ring0.value }],
      opacity: op0.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: ring1.value }],
      opacity: op1.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: ring2.value }],
      opacity: op2.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: ring3.value }],
      opacity: op3.value,
    })),
  ];

  const half = size / 2;

  return (
    <>
      {colors.map((color, index) => (
        <Animated.View
          key={color + index}
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: 3,
              borderColor: color,
              top: "50%",
              left: "50%",
              marginTop: -half,
              marginLeft: -half,
            },
            styles[index],
          ]}
        />
      ))}
    </>
  );
}

interface NuanceCellViewProps {
  cell: NuanceCell;
  cellSize: number;
  revealed: boolean;
  lotusCleared: boolean;
  pebbled: boolean;
  elementWave: boolean;
  onReveal: (id: string) => void;
  onTogglePebble: (id: string) => void;
}

function NuanceCellView({
  cell,
  cellSize,
  revealed,
  lotusCleared,
  pebbled,
  elementWave,
  onReveal,
  onTogglePebble,
}: NuanceCellViewProps) {
  const opacity = useSharedValue(revealed || elementWave ? 1 : 0);
  const scale = useSharedValue(
    revealed && (cell.isSource || lotusCleared) ? 0.72 : 1
  );
  const iconScale = useSharedValue(revealed ? 0.5 : 0);
  const waveOpacity = useSharedValue(elementWave ? 0.45 : 0);

  const displayColor = lotusCleared ? LOTUS_SOURCE.clearColor : cell.revealColor;
  const elementVisual =
    cell.elementKind != null ? ELEMENT_VISUALS[cell.elementKind] : null;
  const deployVisual =
    cell.deployFrom != null ? ELEMENT_VISUALS[cell.deployFrom] : null;

  const showElementRings =
    revealed && cell.kind === "element" && elementVisual != null;
  const showDeployWave =
    elementWave && !revealed && cell.deployFrom != null && deployVisual != null;
  const showIcon =
    revealed &&
    (cell.kind === "element" ||
      cell.kind === "lotus" ||
      (cell.kind === "normal" && cell.deployFrom != null));

  useEffect(() => {
    if (revealed || lotusCleared || elementWave) {
      const delay = lotusCleared && !cell.isSource ? 80 : 0;
      opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
      if (cell.kind === "lotus" || cell.kind === "element" || cell.kind === "primary") {
        scale.value = withDelay(
          delay,
          withSpring(1, { damping: 12, stiffness: 110 })
        );
      } else if (lotusCleared) {
        scale.value = withDelay(delay, withTiming(1, { duration: 500 }));
      }
      if (revealed && (cell.kind === "element" || cell.kind === "lotus")) {
        iconScale.value = withDelay(
          delay,
          withSpring(1, { damping: 10, stiffness: 140 })
        );
      }
      if (revealed && cell.deployFrom) {
        iconScale.value = withDelay(
          delay,
          withSpring(1, { damping: 12, stiffness: 120 })
        );
      }
    } else {
      opacity.value = 0;
      scale.value = cell.isSource ? 0.72 : 1;
      iconScale.value = 0;
    }
  }, [
    revealed,
    lotusCleared,
    elementWave,
    cell.isSource,
    cell.kind,
    cell.deployFrom,
    opacity,
    scale,
    iconScale,
  ]);

  useEffect(() => {
    if (showDeployWave) {
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 600 }),
          withTiming(0.25, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      waveOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showDeployWave, waveOpacity]);

  const colorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconScale.value,
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  const icon =
    cell.kind === "lotus"
      ? LOTUS_SOURCE.icon
      : cell.elementKind
        ? ELEMENT_VISUALS[cell.elementKind].icon
        : cell.deployFrom
          ? ELEMENT_VISUALS[cell.deployFrom].icon
          : null;

  const iconSize =
    cell.kind === "element"
      ? ELEMENT_ICON_SIZE
      : cell.kind === "lotus"
        ? LOTUS_ICON_SIZE
        : DEPLOY_ICON_SIZE;

  const ringColors = elementVisual?.ringColors ?? deployVisual?.ringColors ?? [];

  const borderRadius = Math.max(10, cellSize * 0.22);

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
      accessibilityLabel={
        cell.kind === "element" && elementVisual
          ? `Élément ${elementVisual.label}`
          : cell.kind === "lotus"
            ? "Lotus"
            : "Case"
      }
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
        {(showElementRings || showDeployWave) && ringColors.length > 0 && (
          <ElementColorRings
            colors={[...ringColors]}
            active={showElementRings || showDeployWave}
            size={cellSize * 0.95}
          />
        )}

        {showDeployWave && (
          <Animated.View
            pointerEvents="none"
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
              waveStyle,
            ]}
          />
        )}

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

        {showIcon && icon && (
          <View className="absolute inset-0 items-center justify-center">
            <Animated.Text
              style={[{ fontSize: iconSize, lineHeight: iconSize + 4 }, iconStyle]}
            >
              {icon}
            </Animated.Text>
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
  const waveTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [lotusCleared, setLotusCleared] = useState<Record<string, boolean>>({});
  const [pebbles, setPebbles] = useState<Record<string, boolean>>({});
  const [elementWave, setElementWave] = useState<Record<string, boolean>>({});

  useEffect(
    () => () => {
      lotusTimers.current.forEach(clearTimeout);
      waveTimers.current.forEach(clearTimeout);
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

  const triggerElementWave = useCallback((cell: NuanceCell) => {
    if (cell.kind !== "element") return;
    const neighborIds = getElementNeighborIds(cell.row, cell.col, GRID_SIZE);
    waveTimers.current.forEach(clearTimeout);
    waveTimers.current = [];

    setElementWave((prev) => {
      const next = { ...prev };
      neighborIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    const clearTimer = setTimeout(() => {
      setElementWave((prev) => {
        const next = { ...prev };
        neighborIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    }, 2400);
    waveTimers.current.push(clearTimer);
  }, []);

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

      if (cell.kind === "element") {
        triggerElementWave(cell);
      }
      if (cell.kind === "lotus") {
        triggerLotusWave(id);
      }
    },
    [grid, revealed, lotusCleared, triggerElementWave, triggerLotusWave]
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
    waveTimers.current.forEach(clearTimeout);
    lotusTimers.current = [];
    waveTimers.current = [];
    setGameSeed(Date.now());
    setRevealed({});
    setLotusCleared({});
    setPebbles({});
    setElementWave({});
  }

  return (
    <View className="flex-1">
      <Text className="text-sand-500 text-sm leading-6 mb-4">
        Quatre éléments (🌍 🔥 💧 🌬️) colorent leur voisinage. Un lotus 🪷
        apaise une zone. Appui long : poser un galet.
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
            elementWave={Boolean(elementWave[cell.id])}
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
          <CreativeBridge
            title="Prolonger l'harmonie"
            subtitle="Notez cette palette ou amorcez un rituel d'écriture."
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

      <View className="flex-row flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-sand-200">
        <Text className="text-sand-400 text-xs w-full text-center mb-1">
          Symboles des éléments
        </Text>
        {[
          ["🌍", "Terre"],
          ["🔥", "Feu"],
          ["💧", "Eau"],
          ["🌬️", "Air"],
          ["🪷", "Lotus"],
        ].map(([icon, label]) => (
          <View key={label} className="items-center px-2">
            <Text style={{ fontSize: 22 }}>{icon}</Text>
            <Text className="text-sand-400 text-xs mt-1">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
