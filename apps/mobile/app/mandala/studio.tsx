import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SpectrumColorPicker } from "@/components/mandala/SpectrumColorPicker";
import { MandalaCanvas } from "@/components/mandala/MandalaCanvas";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import { exportMandala } from "@/lib/mandala/export";
import { generateMandala } from "@/lib/mandala/generator";
import {
  getMandalaDisplaySize,
  getThemeDefaultColor,
  getThemeSuggestedPalette,
  MANDALA_THEME_LABELS,
} from "@/lib/mandala/palette";
import { getMandalaCustomPalette } from "@/lib/mandala/customPalette";
import {
  clearMandalaProgress,
  createMandalaSeed,
  getMandalaProgress,
  saveMandalaProgress,
} from "@/lib/mandala/storage";
import type { MandalaFills, MandalaTheme } from "@/lib/mandala/types";
import {
  extractDominantColors,
  startRitualFromColors,
} from "@/lib/fil/bridges";

function parseTheme(value: string | string[] | undefined): MandalaTheme {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "energy" || raw === "focus" || raw === "calm") return raw;
  return "calm";
}

export default function MandalaStudioScreen() {
  const { theme: themeParam } = useLocalSearchParams<{ theme?: string }>();
  const theme = parseTheme(themeParam);
  const { width: windowWidth } = useWindowDimensions();
  const mandalaSize = getMandalaDisplaySize(windowWidth);
  const [seed, setSeed] = useState<number | null>(null);
  const [fills, setFills] = useState<MandalaFills>({});
  const [undoStack, setUndoStack] = useState<
    Array<{ pathId: string; previousColor?: string }>
  >([]);
  const [selectedColor, setSelectedColor] = useState(() =>
    getThemeDefaultColor(theme)
  );
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customPalette, setCustomPalette] = useState<string[] | null>(null);

  const spec = useMemo(() => {
    if (seed === null) return null;
    return generateMandala(theme, seed);
  }, [theme, seed]);

  const meta = MANDALA_THEME_LABELS[theme];
  const dominantColors = useMemo(
    () => extractDominantColors(fills),
    [fills]
  );
  const hasColoring = Object.keys(fills).length > 0;
  const suggestedColors = customPalette ?? getThemeSuggestedPalette(theme);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      setLoading(true);
      const [saved, palette] = await Promise.all([
        getMandalaProgress(theme),
        getMandalaCustomPalette(),
      ]);
      if (!active) return;
      setCustomPalette(palette);

      if (saved) {
        setSeed(saved.seed);
        setFills(saved.fills);
        setUndoStack([]);
        if (saved.selectedColor) {
          setSelectedColor(saved.selectedColor);
        }
      } else {
        const newSeed = createMandalaSeed();
        setSeed(newSeed);
        setFills({});
        setUndoStack([]);
        await saveMandalaProgress(theme, {
          seed: newSeed,
          fills: {},
          selectedColor: getThemeDefaultColor(theme),
        });
      }
      setLoading(false);
    }

    loadProgress();
    return () => {
      active = false;
    };
  }, [theme]);

  const persistProgress = useCallback(
    async (nextFills: MandalaFills, nextColor: string, nextSeed: number) => {
      await saveMandalaProgress(theme, {
        seed: nextSeed,
        fills: nextFills,
        selectedColor: nextColor,
      });
    },
    [theme]
  );

  function handleFillPath(pathId: string, color: string) {
    if (seed === null) return;
    const previousColor = fills[pathId];
    if (previousColor === color) return;

    setUndoStack((stack) => [...stack.slice(-49), { pathId, previousColor }]);
    setFills((prev) => {
      const next = { ...prev, [pathId]: color };
      void persistProgress(next, selectedColor, seed);
      return next;
    });
  }

  function handleUndo() {
    if (seed === null || undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1]!;
    setUndoStack((stack) => stack.slice(0, -1));
    setFills((prev) => {
      const next = { ...prev };
      if (last.previousColor === undefined) {
        delete next[last.pathId];
      } else {
        next[last.pathId] = last.previousColor;
      }
      void persistProgress(next, selectedColor, seed);
      return next;
    });
  }

  function handleSelectColor(color: string) {
    setSelectedColor(color);
    if (seed !== null) {
      void persistProgress(fills, color, seed);
    }
  }

  async function handleNewMandala() {
    const newSeed = createMandalaSeed();
    setSeed(newSeed);
    setFills({});
    setUndoStack([]);
    await clearMandalaProgress(theme);
    await saveMandalaProgress(theme, {
      seed: newSeed,
      fills: {},
      selectedColor,
    });
  }

  async function handleExport(format: "png" | "pdf") {
    if (!spec) return;
    setExporting(true);
    try {
      const result = await exportMandala(spec, fills, format);
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

  return (
    <ScreenContainer scrollable refreshable>
      <ScreenNavBar
        backLabel="← Changer d'intention"
        onBack={() => router.replace("/mandala")}
      />

      <Text className="text-sand-800 text-xl font-light mb-1">
        {meta.emoji} {meta.title}
      </Text>
      <Text className="text-sand-500 text-sm mb-6 leading-5">
        Touchez une zone pour la colorier, sans pression. Vous pourrez
        prolonger vers un exercice une fois votre mandala avancé, si vous le
        souhaitez.
      </Text>

      <View
        className="items-center mb-6 justify-center"
        style={{ minHeight: mandalaSize }}
      >
        {loading || !spec ? (
          <ActivityIndicator size="large" color="#6B8F71" />
        ) : (
          <MandalaCanvas
            spec={spec}
            fills={fills}
            selectedColor={selectedColor}
            onFillPath={handleFillPath}
            size={mandalaSize}
          />
        )}
      </View>

      <Text className="text-sand-600 text-sm font-medium mb-2 text-center">
        Palette
      </Text>
      <SpectrumColorPicker
        selected={selectedColor}
        onSelect={handleSelectColor}
        suggestedColors={suggestedColors}
      />

      {hasColoring && (
        <>
          <CreativeBridge
            title="Approfondir avec un exercice ?"
            subtitle="Si vous le souhaitez, votre création peut devenir une impulsion pour peindre."
            actions={[
              {
                label: "Passer à l'exercice",
                onPress: () =>
                  startRitualFromColors(
                    dominantColors.length > 0
                      ? dominantColors
                      : [selectedColor],
                    "Mandala"
                  ),
                variant: "primary",
              },
            ]}
          />
          <AddToFilBar
            entry={{
              source: "mandala",
              summary: `Mandala — ${meta.title}`,
              detail: `${Object.keys(fills).length} zones coloriées`,
              metadata: {
                colors: dominantColors.length
                  ? dominantColors
                  : [selectedColor],
                theme,
              },
            }}
          />
        </>
      )}

      <View className="gap-3 mt-8 pb-4">
        <PrimaryButton
          label="Annuler le dernier geste"
          onPress={handleUndo}
          disabled={undoStack.length === 0 || loading}
          variant="secondary"
        />
        <PrimaryButton
          label={exporting ? "Export…" : "Exporter en PNG"}
          onPress={() => handleExport("png")}
          disabled={exporting || !spec}
          variant="ghost"
        />
        <PrimaryButton
          label="Exporter en PDF (impression)"
          onPress={() => handleExport("pdf")}
          disabled={exporting || !spec}
          variant="ghost"
        />
        <PrimaryButton
          label="Nouveau mandala"
          onPress={handleNewMandala}
          disabled={loading}
          variant="ghost"
        />
      </View>
    </ScreenContainer>
  );
}
