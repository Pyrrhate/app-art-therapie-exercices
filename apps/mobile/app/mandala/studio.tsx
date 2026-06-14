import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ColorPalette } from "@/components/mandala/ColorPalette";
import { MandalaCanvas } from "@/components/mandala/MandalaCanvas";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { showAlert } from "@/lib/alert";
import { exportMandala } from "@/lib/mandala/export";
import { generateMandala } from "@/lib/mandala/generator";
import {
  MANDALA_COLORS,
  MANDALA_THEME_LABELS,
} from "@/lib/mandala/palette";
import {
  clearMandalaProgress,
  createMandalaSeed,
  getMandalaProgress,
  saveMandalaProgress,
} from "@/lib/mandala/storage";
import type { MandalaFills, MandalaTheme } from "@/lib/mandala/types";

function parseTheme(value: string | string[] | undefined): MandalaTheme {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "energy" || raw === "focus" || raw === "calm") return raw;
  return "calm";
}

export default function MandalaStudioScreen() {
  const { theme: themeParam } = useLocalSearchParams<{ theme?: string }>();
  const theme = parseTheme(themeParam);
  const [seed, setSeed] = useState<number | null>(null);
  const [fills, setFills] = useState<MandalaFills>({});
  const [selectedColor, setSelectedColor] = useState(MANDALA_COLORS[1].hex);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const spec = useMemo(() => {
    if (seed === null) return null;
    return generateMandala(theme, seed);
  }, [theme, seed]);

  const meta = MANDALA_THEME_LABELS[theme];

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      setLoading(true);
      const saved = await getMandalaProgress(theme);
      if (!active) return;

      if (saved) {
        setSeed(saved.seed);
        setFills(saved.fills);
        if (saved.selectedColor) {
          setSelectedColor(saved.selectedColor);
        }
      } else {
        const newSeed = createMandalaSeed();
        setSeed(newSeed);
        setFills({});
        await saveMandalaProgress(theme, {
          seed: newSeed,
          fills: {},
          selectedColor: MANDALA_COLORS[1].hex,
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
    setFills((prev) => {
      const next = { ...prev, [pathId]: color };
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
    <ScreenContainer scrollable>
      <Pressable
        onPress={() => router.replace("/mandala")}
        className="mb-4 -mt-2"
      >
        <Text className="text-sage-500 text-base">← Changer d'intention</Text>
      </Pressable>

      <Text className="text-sand-800 text-xl font-light mb-1">
        {meta.emoji} {meta.title}
      </Text>
      <Text className="text-sand-500 text-sm mb-6">
        Touchez une zone pour la colorier
      </Text>

      <View className="items-center mb-6 min-h-[340px] justify-center">
        {loading || !spec ? (
          <ActivityIndicator size="large" color="#6B8F71" />
        ) : (
          <MandalaCanvas
            spec={spec}
            fills={fills}
            selectedColor={selectedColor}
            onFillPath={handleFillPath}
          />
        )}
      </View>

      <Text className="text-sand-600 text-sm font-medium mb-2 text-center">
        Palette
      </Text>
      <ColorPalette selected={selectedColor} onSelect={handleSelectColor} />

      <View className="gap-3 mt-8 pb-4">
        <PrimaryButton
          label={exporting ? "Export…" : "Exporter en PNG"}
          onPress={() => handleExport("png")}
          disabled={exporting || !spec}
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
