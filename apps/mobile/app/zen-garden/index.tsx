import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { ZenGardenCanvas } from "@/components/zen-garden/ZenGardenCanvas";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import { startRitualFromImpulse } from "@/lib/fil/bridges";
import { recordFilEntry } from "@/lib/fil/record";
import { FEATURES } from "@/lib/features";
import { navigateHome } from "@/lib/navigation";
import { exportZenGarden } from "@/lib/zen-garden/export";
import { loadZenGarden, saveZenGarden } from "@/lib/zen-garden/storage";
import {
  createDefaultZenGardenState,
  PEBBLE_VARIANTS,
  type PebbleVariant,
  type SandPatch,
  type WaterBody,
  type ZenGardenState,
  type ZenPebble,
  type ZenPoint,
  type ZenTool,
  type ZenUndoEntry,
} from "@/lib/zen-garden/types";

const GARDEN_PADDING = 48;
const GARDEN_MAX = 420;
const GARDEN_MIN = 300;

export default function ZenGardenScreen() {
  useEffect(() => {
    if (!FEATURES.zenGarden) {
      router.replace("/");
    }
  }, []);

  const { width: windowWidth } = useWindowDimensions();
  const gardenWidth = Math.min(
    GARDEN_MAX,
    Math.max(GARDEN_MIN, windowWidth - GARDEN_PADDING)
  );

  const [sandPatches, setSandPatches] = useState<SandPatch[]>([]);
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>([]);
  const [pebbles, setPebbles] = useState<ZenPebble[]>([]);
  const [sandColor, setSandColor] = useState(
    createDefaultZenGardenState().sandColor
  );
  const [tool, setTool] = useState<ZenTool>("sand");
  const [pebbleVariant, setPebbleVariant] = useState<PebbleVariant>(0);
  const [liveSandPoints, setLiveSandPoints] = useState<ZenPoint[] | null>(null);
  const [liveWaterRect, setLiveWaterRect] = useState<{
    start: ZenPoint;
    end: ZenPoint;
  } | null>(null);
  const [undoStack, setUndoStack] = useState<ZenUndoEntry[]>([]);
  const [contemplating, setContemplating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildState = useCallback(
    (
      nextSand: SandPatch[],
      nextWater: WaterBody[],
      nextPebbles: ZenPebble[],
      nextSandColor: string
    ): ZenGardenState => ({
      version: 2,
      sandPatches: nextSand,
      waterBodies: nextWater,
      pebbles: nextPebbles,
      sandColor: nextSandColor,
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  const persist = useCallback(
    (
      nextSand: SandPatch[],
      nextWater: WaterBody[],
      nextPebbles: ZenPebble[],
      nextSandColor: string
    ) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveZenGarden(
          buildState(nextSand, nextWater, nextPebbles, nextSandColor)
        );
      }, 400);
    },
    [buildState]
  );

  useEffect(() => {
    let active = true;
    void loadZenGarden().then((state) => {
      if (!active) return;
      setSandPatches(state.sandPatches);
      setWaterBodies(state.waterBodies);
      setPebbles(state.pebbles);
      setSandColor(state.sandColor);
      setLoading(false);
    });
    return () => {
      active = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleSandComplete(patch: SandPatch) {
    setSandPatches((prev) => {
      const next = [...prev, patch];
      persist(next, waterBodies, pebbles, sandColor);
      return next;
    });
    setUndoStack((stack) => [...stack.slice(-49), { kind: "sand", patch }]);
  }

  function handleWaterComplete(body: WaterBody) {
    setWaterBodies((prev) => {
      const next = [...prev, body];
      persist(sandPatches, next, pebbles, sandColor);
      return next;
    });
    setUndoStack((stack) => [...stack.slice(-49), { kind: "water", body }]);
  }

  function handlePlacePebble(pebble: ZenPebble) {
    setPebbles((prev) => {
      const next = [...prev, pebble];
      persist(sandPatches, waterBodies, next, sandColor);
      return next;
    });
    setUndoStack((stack) => [...stack.slice(-49), { kind: "pebble", pebble }]);
  }

  function handleMovePebble(pebbleId: string, x: number, y: number) {
    setPebbles((prev) =>
      prev.map((p) => (p.id === pebbleId ? { ...p, x, y } : p))
    );
  }

  function handleMovePebbleEnd(pebbleId: string, from: ZenPoint, to: ZenPoint) {
    setPebbles((prev) => {
      const next = prev.map((p) =>
        p.id === pebbleId ? { ...p, x: to.x, y: to.y } : p
      );
      persist(sandPatches, waterBodies, next, sandColor);
      return next;
    });
    if (Math.hypot(from.x - to.x, from.y - to.y) > 2) {
      setUndoStack((stack) => [
        ...stack.slice(-49),
        { kind: "movePebble", pebbleId, from, to },
      ]);
    }
  }

  function handleRemovePebble(pebbleId: string) {
    const removed = pebbles.find((p) => p.id === pebbleId);
    if (!removed) return;
    setPebbles((prev) => {
      const next = prev.filter((p) => p.id !== pebbleId);
      persist(sandPatches, waterBodies, next, sandColor);
      return next;
    });
    setUndoStack((stack) => [
      ...stack.slice(-49),
      { kind: "removePebble", pebble: removed },
    ]);
  }

  function handleUndo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;

    if (last.kind === "sand") {
      setSandPatches((prev) => {
        const next = prev.filter((p) => p.id !== last.patch.id);
        persist(next, waterBodies, pebbles, sandColor);
        return next;
      });
    } else if (last.kind === "water") {
      setWaterBodies((prev) => {
        const next = prev.filter((b) => b.id !== last.body.id);
        persist(sandPatches, next, pebbles, sandColor);
        return next;
      });
    } else if (last.kind === "pebble") {
      setPebbles((prev) => {
        const next = prev.filter((p) => p.id !== last.pebble.id);
        persist(sandPatches, waterBodies, next, sandColor);
        return next;
      });
    } else if (last.kind === "removePebble") {
      setPebbles((prev) => {
        const next = [...prev, last.pebble];
        persist(sandPatches, waterBodies, next, sandColor);
        return next;
      });
    } else if (last.kind === "movePebble") {
      setPebbles((prev) => {
        const next = prev.map((p) =>
          p.id === last.pebbleId ? { ...p, x: last.from.x, y: last.from.y } : p
        );
        persist(sandPatches, waterBodies, next, sandColor);
        return next;
      });
    }
    setUndoStack((stack) => stack.slice(0, -1));
  }

  function handleClear() {
    const run = () => {
      setSandPatches([]);
      setWaterBodies([]);
      setPebbles([]);
      setUndoStack([]);
      void saveZenGarden(buildState([], [], [], sandColor));
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
      const result = await exportZenGarden(
        buildState(sandPatches, waterBodies, pebbles, sandColor)
      );
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

  const hasContent =
    sandPatches.length > 0 || waterBodies.length > 0 || pebbles.length > 0;
  const impulseText = hasContent
    ? `Jardin zen — ${sandPatches.length} touche${sandPatches.length > 1 ? "s" : ""} de sable, ${waterBodies.length} eau, ${pebbles.length} galet${pebbles.length > 1 ? "s" : ""}`
    : "Jardin zen du moment";

  const filRecordedRef = useRef(false);

  useEffect(() => {
    if (!hasContent || filRecordedRef.current) return;
    filRecordedRef.current = true;
    void recordFilEntry({
      source: "zen-garden",
      summary: "Jardin zen",
      detail: impulseText,
      metadata: { impulse: impulseText },
    });
  }, [hasContent, impulseText]);

  const canvasProps = {
    sandColor,
    sandPatches,
    waterBodies,
    pebbles,
    pebbleVariant,
    onSandComplete: handleSandComplete,
    onWaterComplete: handleWaterComplete,
    onPlacePebble: handlePlacePebble,
    onRemovePebble: handleRemovePebble,
    onMovePebble: handleMovePebble,
    onMovePebbleEnd: handleMovePebbleEnd,
  };

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
          width={Math.min(windowWidth - 24, 480)}
          tool="sand"
          {...canvasProps}
          onSandComplete={() => {}}
          onWaterComplete={() => {}}
          onPlacePebble={() => {}}
          onRemovePebble={() => {}}
          onMovePebble={() => {}}
          onMovePebbleEnd={() => {}}
          interactive={false}
        />
        <Text className="text-sand-400 text-xs mt-6 px-8 text-center">
          Contemplation — touchez Quitter pour revenir
        </Text>
      </View>
    );
  }

  if (!FEATURES.zenGarden) {
    return null;
  }

  return (
    <ScreenContainer scrollable refreshable>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <PastekScreenHero
        label="Jardin zen"
        title="Coupe "
        accent="latérale"
        description="Composez un jardin en profil : déposez du sable, ajoutez de l'eau, posez des galets. En mode galet : touchez pour poser, glissez pour déplacer, retouchez pour retirer."
        className="mb-6"
      />

      {!loading && (
        <ZenGardenCanvas
          width={gardenWidth}
          tool={tool}
          liveSandPoints={liveSandPoints}
          liveWaterRect={liveWaterRect}
          onLiveSandChange={setLiveSandPoints}
          onLiveWaterChange={setLiveWaterRect}
          {...canvasProps}
        />
      )}

      <View className="flex-row justify-center gap-2 mt-6 mb-4 flex-wrap">
        {(
          [
            { id: "sand" as const, label: "🏖️ Sable" },
            { id: "water" as const, label: "💧 Eau" },
            { id: "pebble" as const, label: "🪨 Galet" },
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

      {tool === "pebble" && (
        <View className="flex-row flex-wrap justify-center gap-2 mb-4">
          {([0, 1, 2, 3] as PebbleVariant[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setPebbleVariant(v)}
              className={`px-3 py-2 rounded-xl border ${
                pebbleVariant === v
                  ? "border-sage-500 bg-sage-50"
                  : "border-sand-200 bg-white"
              }`}
            >
              <Text className="text-sand-600 text-xs">
                {PEBBLE_VARIANTS[v].label}
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
              title="Approfondir avec un exercice ?"
              subtitle="Si vous le souhaitez, votre jardin peut devenir une impulsion pour créer."
              actions={[
                {
                  label: "Passer à l'exercice",
                  variant: "primary",
                  onPress: () => startRitualFromImpulse(impulseText, "mixed_media"),
                },
              ]}
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
