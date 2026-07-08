import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
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
import { AmorceOutcomePanel } from "@/components/amorce/AmorceOutcomePanel";
import { LotusMark, PastekIcon } from "@/components/ui/ModuleIcon";
import { recordFilEntry } from "@/lib/fil/record";
import {
  colorsToFilMetadata,
  elementKindsToLabels,
} from "@/lib/fil/nuancier";
import { fetchNuanceMirror } from "@/lib/api";
import { resolveColorLabel, type ColorForImpulse } from "@/lib/color-names";
import { LOTUS_SOURCE, ELEMENT_QUALITIES, ELEMENT_VISUALS, type ElementKind } from "@/lib/nuance-finder/elements";
import {
  buildNuanceAugmentationContext,
  buildNuanceImpulse,
} from "@/lib/nuance-finder/context";
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
  celebrationDelayMs: number;
  pebbled: boolean;
  onReveal: (id: string) => void;
  onTogglePebble: (id: string) => void;
}

function NuanceCellView({
  cell,
  cellSize,
  revealed,
  waveDelayMs,
  celebrationDelayMs,
  pebbled,
  onReveal,
  onTogglePebble,
}: NuanceCellViewProps) {
  const opacity = useSharedValue(revealed ? 1 : 0);
  const scale = useSharedValue(revealed ? 1 : cell.isSource ? 0.75 : 0.88);
  const borderRadius = Math.max(4, Math.round(cellSize * 0.1));

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

  useEffect(() => {
    if (celebrationDelayMs < 0 || !revealed) return;
    scale.value = withDelay(
      celebrationDelayMs,
      withSpring(1.1, { damping: 8, stiffness: 220, mass: 0.55 })
    );
    const settle = setTimeout(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    }, celebrationDelayMs + 220);
    return () => clearTimeout(settle);
  }, [celebrationDelayMs, revealed, scale]);

  const colorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const showLotusIcon = revealed && cell.kind === "lotus";
  const elementVisual =
    cell.elementKind && revealed ? ELEMENT_VISUALS[cell.elementKind] : null;

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

        {showLotusIcon && elementVisual && (
          <View className="absolute inset-0 items-center justify-center">
            <Text style={{ fontSize: Math.max(14, cellSize * 0.34) }}>
              {elementVisual.icon}
            </Text>
          </View>
        )}
        {showLotusIcon && !elementVisual && (
          <View className="absolute inset-0 items-center justify-center">
            <PastekIcon
              id="lotus"
              boxSize={Math.max(22, cellSize * 0.52)}
              size={Math.max(14, cellSize * 0.38)}
              className="mb-0"
            />
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
  const [discoveredElements, setDiscoveredElements] = useState<ElementKind[]>([]);
  const [lastElementHint, setLastElementHint] = useState<string | null>(null);
  const [harmonyName, setHarmonyName] = useState("");
  const [celebrationDelays, setCelebrationDelays] = useState<
    Record<string, number>
  >({});
  const filRecordedRef = useRef(false);
  const completionTriggeredRef = useRef(false);
  const [harmonyMirror, setHarmonyMirror] = useState<string | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);

  const gridPulse = useSharedValue(1);
  const titleScale = useSharedValue(1);

  useEffect(
    () => () => {
      lotusTimers.current.forEach(clearTimeout);
    },
    []
  );

  const revealedCount = flatCells.filter((c) => revealed[c.id]).length;
  const harmonyFound = revealedCount >= flatCells.length;

  const gridPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gridPulse.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  useEffect(() => {
    if (!harmonyFound || completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;

    const center = (GRID_SIZE - 1) / 2;
    const delays: Record<string, number> = {};
    for (const cell of flatCells) {
      const distance = Math.hypot(cell.row - center, cell.col - center);
      delays[cell.id] = Math.round(distance * 55);
    }
    setCelebrationDelays(delays);

    gridPulse.value = withSpring(1.035, { damping: 9, stiffness: 130 });
    titleScale.value = withSpring(1.06, { damping: 10, stiffness: 150 });
    const settle = setTimeout(() => {
      gridPulse.value = withSpring(1, { damping: 14, stiffness: 180 });
      titleScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    }, 600);
    return () => clearTimeout(settle);
  }, [harmonyFound, flatCells, gridPulse, titleScale]);

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

  const canContinue = revealedCount >= 6;
  const impulse = buildNuanceImpulse(revealedColorItems, harmonyName);
  const augmentationContext = buildNuanceAugmentationContext({
    colors: revealedColorItems,
    harmonyName,
    discoveredElements,
    revealedCount,
    totalCells: flatCells.length,
  });

  function recordNuanceFil(mirrorText?: string) {
    if (filRecordedRef.current) return;
    filRecordedRef.current = true;
    const paletteMeta = colorsToFilMetadata(revealedColorItems);
    void recordFilEntry({
      source: "nuances",
      summary: harmonyName.trim()
        ? `Harmonie : ${harmonyName.trim()}`
        : "Harmonie chromatique trouvée",
      detail: `${flatCells.length} cases · ${foundLotusCount} lotus`,
      metadata: {
        ...paletteMeta,
        harmonyName: harmonyName.trim() || undefined,
        discoveredElements: elementKindsToLabels(discoveredElements),
        colorContext: augmentationContext,
        colorMirror: mirrorText,
        paletteSource: "nuances",
        impulse,
      },
    });
  }

  useEffect(() => {
    if (!canContinue) return;

    let cancelled = false;
    const colors = revealedColorItems.map((c) => ({
      hex: typeof c === "string" ? c : c.hex,
      label: resolveColorLabel(c),
    }));

    void (async () => {
      setMirrorLoading(true);
      try {
        const result = await fetchNuanceMirror({
          colors,
          harmonyName: harmonyName.trim() || undefined,
          discoveredElements: elementKindsToLabels(discoveredElements),
          revealedCount,
          totalCells: flatCells.length,
        });
        if (cancelled) return;
        setHarmonyMirror(result.mirror);
        recordNuanceFil(result.mirror);
      } finally {
        if (!cancelled) setMirrorLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canContinue,
    revealedCount,
    flatCells.length,
    harmonyName,
    discoveredElements,
    revealedColorItems,
    augmentationContext,
    impulse,
    foundLotusCount,
  ]);

  const triggerLotusWave = useCallback(
    (lotusId: string) => {
      const lotus = findLotus(grid, lotusId);
      if (!lotus) return;

      setDiscoveredElements((prev) =>
        prev.includes(lotus.elementKind) ? prev : [...prev, lotus.elementKind]
      );
      const visual = ELEMENT_VISUALS[lotus.elementKind];
      setLastElementHint(
        `${visual.icon} Lotus ${visual.label} — ${ELEMENT_QUALITIES[lotus.elementKind]}`
      );

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
    completionTriggeredRef.current = false;
    setHarmonyMirror(null);
    setMirrorLoading(false);
    lotusTimers.current.forEach(clearTimeout);
    lotusTimers.current = [];
    setGameSeed(Date.now());
    setRevealed({});
    setWaveDelays({});
    setPebbles({});
    setFoundLotusCount(0);
    setDiscoveredElements([]);
    setLastElementHint(null);
    setHarmonyName("");
    setCelebrationDelays({});
    gridPulse.value = 1;
    titleScale.value = 1;
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
        <View className="flex-row flex-wrap justify-center items-center gap-x-1 gap-y-1">
          <Text
            className={`text-[13px] leading-6 text-center ${textMuted(isDark)}`}
          >
            Touchez les cases pour révéler les teintes. {LOTUS_COUNT} lotus
            élémentaires
          </Text>
          <LotusMark size={16} />
          <Text
            className={`text-[13px] leading-6 text-center ${textMuted(isDark)}`}
          >
            sont cachés : ils dévoilent les couleurs alentour en onde. Appui
            long : poser un galet.
          </Text>
        </View>
      </View>

      {lastElementHint ? (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-3 mb-4">
          <Text className={`text-sm text-center leading-6 ${textMuted(isDark)}`}>
            {lastElementHint}
          </Text>
        </View>
      ) : null}

      <Animated.View
        className={`self-center rounded-3xl border p-3 mb-5 ${
          harmonyFound
            ? isDark
              ? "border-sage-500 bg-sand-800/60"
              : "border-sage-400 bg-white/60"
            : isDark
              ? "bg-sand-800/60 border-sand-700"
              : "bg-white/60 border-sand-200"
        }`}
        style={[!isDark ? gridCardShadow : undefined, gridPulseStyle]}
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
              celebrationDelayMs={celebrationDelays[cell.id] ?? -1}
              pebbled={Boolean(pebbles[cell.id])}
              onReveal={handleReveal}
              onTogglePebble={handleTogglePebble}
            />
          ))}
        </View>
      </Animated.View>

      {harmonyFound ? (
        <View className="gap-3 mb-4">
          <Animated.Text
            className={`font-display text-2xl text-center ${textPrimary(isDark)}`}
            style={[{ letterSpacing: -0.3 }, titleAnimStyle]}
          >
            Harmonie trouvée
          </Animated.Text>
          <Text className={`text-sm text-center ${textMuted(isDark)}`}>
            Donnez un nom à cette harmonie (optionnel)
          </Text>
          <TextInput
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "bg-sand-800 border-sand-600 text-sand-100"
                : "bg-white border-sand-200 text-sand-800"
            }`}
            placeholder="Ex. Brume du matin, Élan doux…"
            placeholderTextColor="#A89F91"
            value={harmonyName}
            onChangeText={setHarmonyName}
          />
        </View>
      ) : null}

      {canContinue ? (
        <View className="mb-4 gap-4">
          {harmonyMirror || mirrorLoading ? (
            <View
              className={`rounded-2xl border px-4 py-4 ${
                isDark
                  ? "bg-sand-800/60 border-sage-600"
                  : "bg-sage-50/90 border-sage-100"
              }`}
            >
              <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
                Lecture de l&apos;harmonie
              </Text>
              {mirrorLoading && !harmonyMirror ? (
                <Text className={`text-sm italic ${textMuted(isDark)}`}>
                  Le miroir chromatique se forme…
                </Text>
              ) : (
                <Text className={`text-sm leading-6 ${textPrimary(isDark)}`}>
                  {harmonyMirror}
                </Text>
              )}
            </View>
          ) : null}
          <AmorceOutcomePanel
            impulse={impulse}
            augmentationContext={augmentationContext}
            colorHints={{
              colorContext: augmentationContext,
              paletteColors: revealedColorItems.map((c) =>
                typeof c === "string" ? c : c.hex
              ),
            }}
          />
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center justify-between gap-3 pt-1">
        <Text className={`text-sm ${textMuted(isDark)}`}>
          {revealedCount} / {flatCells.length} teintes révélées
        </Text>

        <PrimaryButton
          label="Nouvelle grille"
          onPress={handleRestart}
          variant="ghost"
          align="start"
        />
      </View>
    </View>
  );
}
