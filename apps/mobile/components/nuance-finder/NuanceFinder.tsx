import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PrimaryButton } from "@/components/ui/Button";
import { createNuanceGrid, flattenGrid, GRID_SIZE } from "@/lib/nuance-finder/grid";
import type { NuanceCell } from "@/lib/nuance-finder/types";

const UNREVEALED_COLOR = "#FAF7F4";
const UNREVEALED_BORDER = "#E8E0D8";

interface NuanceCellViewProps {
  cell: NuanceCell;
  revealed: boolean;
  pebbled: boolean;
  onReveal: (id: string) => void;
  onTogglePebble: (id: string) => void;
}

function NuanceCellView({
  cell,
  revealed,
  pebbled,
  onReveal,
  onTogglePebble,
}: NuanceCellViewProps) {
  const opacity = useSharedValue(revealed ? 1 : 0);
  const scale = useSharedValue(revealed && cell.isSource ? 0.72 : 1);

  useEffect(() => {
    if (revealed) {
      opacity.value = withTiming(1, { duration: 480 });
      if (cell.isSource) {
        scale.value = withSpring(1, { damping: 14, stiffness: 120 });
      }
    } else {
      opacity.value = 0;
      scale.value = cell.isSource ? 0.72 : 1;
    }
  }, [revealed, cell.isSource, opacity, scale]);

  const colorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onReveal(cell.id)}
      onLongPress={() => onTogglePebble(cell.id)}
      delayLongPress={320}
      className="p-0.5"
      style={{ width: `${100 / GRID_SIZE}%`, aspectRatio: 1 }}
      accessibilityRole="button"
      accessibilityLabel={
        revealed
          ? cell.isSource
            ? "Source de couleur pure révélée"
            : "Nuancier révélé"
          : "Case cachée, appui long pour poser un galet"
      }
    >
      <View
        className="flex-1 rounded-lg overflow-hidden"
        style={{
          backgroundColor: UNREVEALED_COLOR,
          borderWidth: 1,
          borderColor: revealed ? "transparent" : UNREVEALED_BORDER,
        }}
      >
        <Animated.View
          style={[
            {
              ...StyleSheetAbsoluteFill,
              backgroundColor: cell.revealColor,
              borderRadius: 8,
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
      </View>
    </TouchableOpacity>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export function NuanceFinder() {
  const [gameSeed, setGameSeed] = useState(() => Date.now());
  const grid = useMemo(() => createNuanceGrid(gameSeed), [gameSeed]);
  const flatCells = useMemo(() => flattenGrid(grid), [grid]);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [pebbles, setPebbles] = useState<Record<string, boolean>>({});

  const revealedCount = Object.keys(revealed).length;
  const totalCells = GRID_SIZE * GRID_SIZE;
  const harmonyFound = revealedCount >= totalCells;

  const handleReveal = useCallback((id: string) => {
    setRevealed((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  }, []);

  const handleTogglePebble = useCallback((id: string) => {
    setPebbles((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  }, []);

  function handleRestart() {
    setGameSeed(Date.now());
    setRevealed({});
    setPebbles({});
  }

  return (
    <View className="flex-1">
      <Text className="text-sand-500 text-sm leading-6 mb-6">
        Touchez une case pour révéler sa nuance. Appui long : poser un galet
        pour marquer une intuition. Aucune pénalité — prenez votre temps.
      </Text>

      <View className="flex-row flex-wrap mx-auto w-full max-w-[360px] mb-6">
        {flatCells.map((cell) => (
          <NuanceCellView
            key={cell.id}
            cell={cell}
            revealed={Boolean(revealed[cell.id])}
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
          <Text className="text-sand-500 text-sm text-center leading-6 px-4">
            Toute la grille respire ensemble. Vous pouvez contempler un instant,
            puis recommencer si le cœur vous en dit.
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