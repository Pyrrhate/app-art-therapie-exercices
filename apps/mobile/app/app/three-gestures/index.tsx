import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AmorceOutcomePanel } from "@/components/amorce/AmorceOutcomePanel";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { recordFilEntry } from "@/lib/fil/record";
import { navigateHome } from "@/lib/navigation";
import {
  pickThreeGestures,
  type ThreeGestureId,
} from "@/lib/three-gestures/catalog";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function ThreeGesturesScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("amorces");
  const [offer, setOffer] = useState<ThreeGestureId[]>(() => pickThreeGestures());
  const [selected, setSelected] = useState<ThreeGestureId | null>(null);
  const [freeWord, setFreeWord] = useState("");
  const filRecordedFor = useRef<string | null>(null);

  const gestureLabel = selected
    ? t(`threeGestures.gestures.${selected}`)
    : "";

  const impulse = useMemo(() => {
    if (!selected) return "";
    const word = freeWord.trim();
    return word ? `${gestureLabel} · ${word}` : gestureLabel;
  }, [selected, gestureLabel, freeWord]);

  const moduleStatement = selected
    ? t("threeGestures.moduleStatement", { gesture: gestureLabel })
    : undefined;

  useEffect(() => {
    if (!selected || !impulse) return;
    if (filRecordedFor.current === selected) return;
    filRecordedFor.current = selected;
    void recordFilEntry({
      source: "three-gestures",
      summary: t("threeGestures.filSummary", { gesture: gestureLabel }),
      detail: impulse,
      metadata: { impulse, moduleStatement },
    });
  }, [selected, impulse, gestureLabel, moduleStatement, t]);

  function handleRefresh() {
    setSelected(null);
    setFreeWord("");
    filRecordedFor.current = null;
    setOffer(pickThreeGestures(selected ? [selected] : []));
  }

  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720} compactTop>
      <ScreenNavBar backLabel={t("nav.back")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("threeGestures.heroLabel")}
        title={t("threeGestures.heroTitle")}
        accent={t("threeGestures.heroAccent")}
        description={t("threeGestures.heroDescription")}
        className="mb-6"
      />

      <Text className={`text-sm leading-6 mb-4 ${textSecondary(isDark)}`}>
        {t("threeGestures.pickHint")}
      </Text>

      <View className="gap-3 mb-6">
        {offer.map((id) => {
          const label = t(`threeGestures.gestures.${id}`);
          const isSelected = selected === id;
          return (
            <HoverScale
              key={id}
              onPress={() => setSelected(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={label}
              hoverScale={1.02}
            >
              <View
                className={`rounded-2xl border px-4 py-4 ${
                  isSelected
                    ? "bg-sage-500 border-sage-500"
                    : panelBg(isDark)
                }`}
              >
                <Text
                  className={`text-base leading-6 ${
                    isSelected ? "text-white" : textPrimary(isDark)
                  }`}
                >
                  {label}
                </Text>
              </View>
            </HoverScale>
          );
        })}
      </View>

      <View className="mb-4 items-center">
        <View className="w-1/2">
          <PrimaryButton
            label={t("threeGestures.refresh")}
            onPress={handleRefresh}
            variant="ghost"
          />
        </View>
      </View>

      {selected ? (
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${textSecondary(isDark)}`}>
            {t("threeGestures.wordLabel")}
          </Text>
          <TextInput
            className={`rounded-2xl border border-sand-200 px-4 py-3 text-base ${
              isDark ? "bg-sand-900 text-sand-100" : "bg-white text-sand-800"
            }`}
            placeholder={t("threeGestures.wordPlaceholder")}
            placeholderTextColor="#A89F91"
            value={freeWord}
            onChangeText={setFreeWord}
            maxLength={80}
          />
          <Text className={`text-xs mt-2 leading-5 ${textMuted(isDark)}`}>
            {t("threeGestures.wordHint")}
          </Text>
        </View>
      ) : null}

      {selected && impulse ? (
        <View className="pb-8">
          <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-4 mb-4">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              {t("threeGestures.impulseTitle")}
            </Text>
            <Text className="text-sand-800 text-lg font-light leading-7">
              {impulse}
            </Text>
          </View>
          <AmorceOutcomePanel
            impulse={impulse}
            moduleStatement={moduleStatement}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}
