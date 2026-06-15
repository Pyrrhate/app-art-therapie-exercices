import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { ZenGardenCanvas } from "@/components/zen-garden/ZenGardenCanvas";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import { startRitualFromImpulse } from "@/lib/fil/bridges";
import { navigateHome } from "@/lib/navigation";
import { exportZenGarden } from "@/lib/zen-garden/export";
import { loadZenGarden, saveZenGarden } from "@/lib/zen-garden/storage";
import {
  ROCK_VARIANTS,
  type RakeStroke,
  type RockVariant,
  type ZenRock,
  type ZenTool,
  type ZenUndoEntry,
} from "@/lib/zen-garden/types";
import type { ZenPoint } from "@/lib/zen-garden/types";

const GARDEN_PADDING = 48;
const GARDEN_MAX = 420;
const GARDEN_MIN = 300;

export default function ZenGardenScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const gardenSize = Math.min(
    GARDEN_MAX,
    Math.max(GARDEN_MIN, windowWidth - GARDEN_PADDING)
  );

  const [strokes, setStrokes] = useState<RakeStroke[]>([]);
  const [rocks, setRocks] = useState<ZenRock[]>([]);
  const [sandColor, setSandColor] = useState("#E8DDD4");
  const [tool, setTool] = useState<ZenTool>("rake");
  const [rockVariant, setRockVariant] = useState<RockVariant>(0);
  const [liveStroke, setLiveStroke] = useState<ZenPoint[] | null>(null);
  const [undoStack, setUndoStack] = useState<ZenUndoEntry[]>([]);
  const [contemplating, setContemplating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (nextStrokes: RakeStroke[], nextRocks: ZenRock[], nextSand: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveZenGarden({
          strokes: nextStrokes,
          rocks: nextRocks,
          sandColor: nextSand,
          updatedAt: new Date().toISOString(),
        });
      }, 400);
    },
    []
  );

  useEffect(() => {
    let active = true;
    void loadZenGarden().then((state) => {
      if (!active) return;
      setStrokes(state.strokes);
      setRocks(state.rocks);
      setSandColor(state.sandColor);
      setLoading(false);
    });
    return () => {
      active = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleStrokeComplete(stroke: RakeStroke) {
    setStrokes((prev) => {
      const next = [...prev, stroke];
      persist(next, rocks, sandColor);
      return next;
    });
    setUndoStack((stack) => [...stack.slice(-49), { kind: "stroke", stroke }]);
  }

  function handlePlaceRock(rock: ZenRock) {
    setRocks((prev) => {
      const next = [...prev, rock];
      persist(strokes, next, sandColor);
      return next;
    });
    setUndoStack((stack) => [...stack.slice(-49), { kind: "rock", rock }]);
  }

  function handleMoveRock(rockId: string, x: number, y: number) {
    setRocks((prev) =>
      prev.map((r) => (r.id === rockId ? { ...r, x, y } : r))
    );
  }

  function handleMoveRockEnd(rockId: string, from: ZenPoint, to: ZenPoint) {
    setRocks((prev) => {
      const next = prev.map((r) =>
        r.id === rockId ? { ...r, x: to.x, y: to.y } : r
      );
      persist(strokes, next, sandColor);
      return next;
    });
    if (Math.hypot(from.x - to.x, from.y - to.y) > 2) {
      setUndoStack((stack) => [
        ...stack.slice(-49),
        { kind: "moveRock", rockId, from, to },
      ]);
    }
  }

  function handleRemoveRock(rockId: string) {
    const removed = rocks.find((r) => r.id === rockId);
    if (!removed) return;
    setRocks((prev) => {
      const next = prev.filter((r) => r.id !== rockId);
      persist(strokes, next, sandColor);
      return next;
    });
    setUndoStack((stack) => [
      ...stack.slice(-49),
      { kind: "removeRock", rock: removed },
    ]);
  }

  function handleUndo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;

    if (last.kind === "stroke") {
      setStrokes((prev) => {
        const next = prev.filter((s) => s.id !== last.stroke.id);
        persist(next, rocks, sandColor);
        return next;
      });
    } else if (last.kind === "rock") {
      setRocks((prev) => {
        const next = prev.filter((r) => r.id !== last.rock.id);
        persist(strokes, next, sandColor);
        return next;
      });
    } else if (last.kind === "removeRock") {
      setRocks((prev) => {
        const next = [...prev, last.rock];
        persist(strokes, next, sandColor);
        return next;
      });
    } else if (last.kind === "moveRock") {
      setRocks((prev) => {
        const next = prev.map((r) =>
          r.id === last.rockId ? { ...r, x: last.from.x, y: last.from.y } : r
        );
        persist(strokes, next, sandColor);
        return next;
      });
    }
    setUndoStack((stack) => stack.slice(0, -1));
  }

  function handleClear() {
    const run = () => {
      setStrokes([]);
      setRocks([]);
      setUndoStack([]);
      void saveZenGarden({
        strokes: [],
        rocks: [],
        sandColor,
        updatedAt: new Date().toISOString(),
      });
    };
    if (Platform.OS === "web") {
      if (window.confirm("Effacer le jardin et recommencer ?")) run();
      return;
    }
    Alert.alert("Effacer le jardin ?", "Toutes les traces seront supprimées.", [
      { text: "Annuler", style: "cancel" },
      { text: "Effacer", style: "destructive", onPress: run },
    ]);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportZenGarden({ strokes, rocks, sandColor, updatedAt: "" });
      showAlert("Export réussi", result.message);
    } catch (error) {
      showAlert(
        "Export impossible",
        error instanceof Error ? error.message : "Réessayez dans un instant."
      );
    } finally {
      setExporting(false);
    }
  }

  const hasContent = strokes.length > 0 || rocks.length > 0;
  const impulseText = hasContent
    ? `Jardin zen — ${strokes.length} sillons, ${rocks.length} pierre${rocks.length > 1 ? "s" : ""}`
    : "Jardin zen du moment";

  if (contemplating) {
    return (
      <View className="flex-1 bg-sand-100 items-center justify-center">
        <Pressable
          className="absolute top-12 right-6 z-10 px-4 py-2 rounded-full bg-white/80 border border-sand-200"
          onPress={() => setContemplating(false)}
        >
          <Text className="text-sand-600 text-sm">Quitter</Text>
        </Pressable>
        <ZenGardenCanvas
          size={Math.min(windowWidth - 24, 480)}
          sandColor={sandColor}
          strokes={strokes}
          rocks={rocks}
          tool="rake"
          rockVariant={rockVariant}
          onStrokeComplete={() => {}}
          onPlaceRock={() => {}}
          onRemoveRock={() => {}}
          onMoveRock={() => {}}
          onMoveRockEnd={() => {}}
          interactive={false}
        />
        <Text className="text-sand-400 text-xs mt-6 px-8 text-center">
          Contemplation — touchez Quitter pour revenir
        </Text>
      </View>
    );
  }

  return (
    <ScreenContainer scrollable refreshable>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
        Jardin zen
      </Text>
      <Text className="text-3xl font-light text-sand-800 mb-2 leading-tight">
        Râteau & pierres
      </Text>
      <Text className="text-sand-500 text-base leading-6 mb-6">
        Glissez pour tracer le sable. En mode pierre : touchez pour poser,
        glissez une pierre pour la déplacer, retouchez pour la retirer.
      </Text>

      {!loading && (
        <ZenGardenCanvas
          size={gardenSize}
          sandColor={sandColor}
          strokes={strokes}
          rocks={rocks}
          tool={tool}
          rockVariant={rockVariant}
          liveStroke={liveStroke}
          onLiveStrokeChange={setLiveStroke}
          onStrokeComplete={handleStrokeComplete}
          onPlaceRock={handlePlaceRock}
          onRemoveRock={handleRemoveRock}
          onMoveRock={handleMoveRock}
          onMoveRockEnd={handleMoveRockEnd}
        />
      )}

      <View className="flex-row justify-center gap-2 mt-6 mb-4">
        {(
          [
            { id: "rake" as const, label: "🪵 Râteau" },
            { id: "rock" as const, label: "🪨 Pierre" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setTool(item.id)}
            className={`px-4 py-3 rounded-2xl border ${
              tool === item.id
                ? "bg-sage-500 border-sage-500"
                : "bg-white border-sand-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                tool === item.id ? "text-white" : "text-sand-700"
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tool === "rock" && (
        <View className="flex-row flex-wrap justify-center gap-2 mb-4">
          {([0, 1, 2, 3] as RockVariant[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setRockVariant(v)}
              className={`px-3 py-2 rounded-xl border ${
                rockVariant === v
                  ? "border-sage-500 bg-sage-50"
                  : "border-sand-200 bg-white"
              }`}
            >
              <Text className="text-sand-600 text-xs">
                {ROCK_VARIANTS[v].label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View className="gap-3 pb-6">
        <PrimaryButton
          label="Annuler le dernier geste"
          onPress={handleUndo}
          variant="secondary"
          disabled={undoStack.length === 0}
        />
        <PrimaryButton
          label="Contempler"
          onPress={() => setContemplating(true)}
          variant="secondary"
          disabled={!hasContent}
        />
        <PrimaryButton
          label={exporting ? "Export…" : "Exporter en PNG"}
          onPress={handleExport}
          disabled={exporting || !hasContent}
        />
        <PrimaryButton
          label="Effacer et recommencer"
          onPress={handleClear}
          variant="ghost"
          disabled={!hasContent}
        />

        {hasContent && (
          <>
            <CreativeBridge
              title="Prolonger le moment"
              actions={[
                {
                  label: "M'inspirer pour un rituel",
                  onPress: () => startRitualFromImpulse(impulseText, "mixed_media"),
                },
              ]}
            />
            <AddToFilBar
              entry={{
                source: "zen-garden",
                summary: "Jardin zen",
                detail: impulseText,
                metadata: { impulse: impulseText },
              }}
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
