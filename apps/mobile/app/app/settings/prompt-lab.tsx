import { useCallback, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { DIAL_LEVELS, type DialLevel } from "@art-therapie/shared";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  DEFAULT_PROMPT_DIALS_PAYLOAD,
  getPromptDials,
  NEUTRAL_PROMPT_DIALS,
  savePromptDials,
  type PromptDialsPayload,
  type PromptDialsValues,
} from "@/lib/promptDials";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const DIAL_KEYS: (keyof PromptDialsValues)[] = [
  "openness",
  "symbolism",
  "length",
  "concreteness",
  "audacity",
];

function DialRow({
  label,
  left,
  right,
  value,
  onChange,
  disabled,
}: {
  label: string;
  left: string;
  right: string;
  value: DialLevel;
  onChange: (v: DialLevel) => void;
  disabled?: boolean;
}) {
  const isDark = useIsDark();
  return (
    <View className={`rounded-2xl border px-4 py-4 gap-3 ${panelBg(isDark)}`}>
      <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>{label}</Text>
      <View className="flex-row items-center justify-between gap-2">
        <Text className={`text-xs flex-1 ${textMuted(isDark)}`}>{left}</Text>
        <View className="flex-row gap-1.5">
          {DIAL_LEVELS.map((level) => {
            const active = value === level;
            return (
              <Pressable
                key={level}
                disabled={disabled}
                onPress={() => onChange(level)}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled }}
                className={`w-9 h-9 rounded-full items-center justify-center border ${
                  active
                    ? "bg-sage-500 border-sage-500"
                    : isDark
                      ? "border-sand-600 bg-sand-900"
                      : "border-sand-200 bg-white"
                } ${disabled ? "opacity-40" : ""}`}
              >
                <Text
                  className={`text-xs font-medium ${
                    active ? "text-white" : textMuted(isDark)
                  }`}
                >
                  {level === 0 ? "·" : level > 0 ? `+${level}` : String(level)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className={`text-xs flex-1 text-right ${textMuted(isDark)}`}>
          {right}
        </Text>
      </View>
    </View>
  );
}

export default function PromptLabSettingsScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const [draft, setDraft] = useState<PromptDialsPayload>({
    ...DEFAULT_PROMPT_DIALS_PAYLOAD,
    values: { ...NEUTRAL_PROMPT_DIALS },
  });
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void getPromptDials().then(setDraft);
    }, [])
  );

  function setEnabled(enabled: boolean) {
    setDraft((prev) => ({ ...prev, enabled }));
  }

  function setDial(key: keyof PromptDialsValues, value: DialLevel) {
    setDraft((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePromptDials(draft);
      showAlert(t("promptLabPage.savedTitle"), t("promptLabPage.savedBody"));
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const next = {
      ...DEFAULT_PROMPT_DIALS_PAYLOAD,
      values: { ...NEUTRAL_PROMPT_DIALS },
    };
    setDraft(next);
    await savePromptDials(next);
    showAlert(t("promptLabPage.resetTitle"), t("promptLabPage.resetBody"));
  }

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar backLabel={t("nav.backSettings")} />
      <PastekScreenHero
        label={t("promptLabPage.heroLabel")}
        title={t("promptLabPage.heroTitle")}
        accent={t("promptLabPage.heroAccent")}
        description={t("promptLabPage.heroDescription")}
        className="mb-6"
      />

      <View
        className={`rounded-2xl border px-5 py-4 mb-5 flex-row items-center justify-between ${panelBg(isDark)}`}
      >
        <View className="flex-1 pr-3">
          <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
            {t("promptLabPage.enableTitle")}
          </Text>
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            {t("promptLabPage.enableHint")}
          </Text>
        </View>
        <Switch
          value={draft.enabled}
          onValueChange={setEnabled}
          trackColor={{ false: "#D6CFC6", true: "#6B8F71" }}
          thumbColor="#FAF7F4"
        />
      </View>

      <Text className={`text-xs leading-5 mb-4 ${textSecondary(isDark)}`}>
        {t("promptLabPage.safetyNote")}
      </Text>

      <View className="gap-3 pb-8">
        {DIAL_KEYS.map((key) => (
          <DialRow
            key={key}
            label={t(`promptLabPage.dials.${key}.label`)}
            left={t(`promptLabPage.dials.${key}.left`)}
            right={t(`promptLabPage.dials.${key}.right`)}
            value={draft.values[key]}
            onChange={(v) => setDial(key, v)}
            disabled={!draft.enabled}
          />
        ))}

        <PrimaryButton
          label={saving ? t("promptLabPage.saving") : t("promptLabPage.save")}
          onPress={() => void handleSave()}
          disabled={saving}
        />
        <PrimaryButton
          label={t("promptLabPage.reset")}
          onPress={() => void handleReset()}
          variant="ghost"
          disabled={saving}
        />
        <Text className={`text-xs leading-5 ${textSecondary(isDark)}`}>
          {t("promptLabPage.localOnly")}
        </Text>
      </View>
    </ScreenContainer>
  );
}
