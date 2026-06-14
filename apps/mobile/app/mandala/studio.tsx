import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
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
import type { MandalaTheme } from "@/lib/mandala/types";
import type { MandalaFills } from "@/lib/mandala/types";

function parseTheme(value: string | string[] | undefined): MandalaTheme {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "energy" || raw === "focus" || raw === "calm") return raw;
  return "calm";
}

export default function MandalaStudioScreen() {
  const { theme: themeParam } = useLocalSearchParams<{ theme?: string }>();
  const theme = parseTheme(themeParam);
  const spec = useMemo(() => generateMandala(theme), [theme]);
  const [fills, setFills] = useState<MandalaFills>({});
  const [selectedColor, setSelectedColor] = useState(MANDALA_COLORS[1].hex);
  const [exporting, setExporting] = useState(false);

  const meta = MANDALA_THEME_LABELS[theme];

  function handleFillPath(pathId: string, color: string) {
    setFills((prev) => ({ ...prev, [pathId]: color }));
  }

  async function handleExport(format: "png" | "pdf") {
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

      <View className="items-center mb-6">
        <MandalaCanvas
          spec={spec}
          fills={fills}
          selectedColor={selectedColor}
          onFillPath={handleFillPath}
        />
      </View>

      <Text className="text-sand-600 text-sm font-medium mb-2 text-center">
        Palette
      </Text>
      <ColorPalette selected={selectedColor} onSelect={setSelectedColor} />

      <View className="gap-3 mt-8 pb-4">
        <PrimaryButton
          label={exporting ? "Export…" : "Exporter en PNG"}
          onPress={() => handleExport("png")}
          disabled={exporting}
        />
        <PrimaryButton
          label="Exporter en PDF (impression)"
          onPress={() => handleExport("pdf")}
          disabled={exporting}
          variant="ghost"
        />
        <PrimaryButton
          label="Nouveau mandala"
          onPress={() => {
            setFills({});
            router.replace({ pathname: "/mandala/studio", params: { theme } });
          }}
          variant="ghost"
        />
      </View>
    </ScreenContainer>
  );
}
