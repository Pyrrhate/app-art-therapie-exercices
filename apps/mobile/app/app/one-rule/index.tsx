import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AmorceOutcomePanel } from "@/components/amorce/AmorceOutcomePanel";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { recordFilEntry } from "@/lib/fil/record";
import { navigateHome } from "@/lib/navigation";
import {
  ONE_RULE_MAX_REDRAWS,
  pickOneRule,
  type OneRuleId,
} from "@/lib/one-rule/catalog";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function OneRuleScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("amorces");
  const [ruleId, setRuleId] = useState<OneRuleId>(() => pickOneRule());
  const [seen, setSeen] = useState<OneRuleId[]>([ruleId]);
  const [redraws, setRedraws] = useState(0);
  const [theme, setTheme] = useState("");
  const [kept, setKept] = useState(false);
  const filRecordedFor = useRef<string | null>(null);

  const ruleLabel = t(`oneRule.rules.${ruleId}`);
  const remainingRedraws = ONE_RULE_MAX_REDRAWS - redraws;

  const impulse = useMemo(() => {
    const word = theme.trim();
    return word ? `${ruleLabel} · ${word}` : ruleLabel;
  }, [ruleLabel, theme]);

  const moduleStatement = t("oneRule.moduleStatement", { rule: ruleLabel });

  useEffect(() => {
    if (!kept || !impulse) return;
    const key = `${ruleId}:${theme.trim()}`;
    if (filRecordedFor.current === key) return;
    filRecordedFor.current = key;
    void recordFilEntry({
      source: "one-rule",
      summary: t("oneRule.filSummary", { rule: ruleLabel }),
      detail: impulse,
      metadata: { impulse, moduleStatement },
    });
  }, [kept, impulse, ruleId, theme, ruleLabel, moduleStatement, t]);

  function handleRedraw() {
    if (remainingRedraws <= 0) return;
    const next = pickOneRule(seen);
    setRuleId(next);
    setSeen((prev) => [...prev, next]);
    setRedraws((n) => n + 1);
    setKept(false);
    filRecordedFor.current = null;
  }

  function handleKeep() {
    setKept(true);
  }

  function handleRestart() {
    const next = pickOneRule();
    setRuleId(next);
    setSeen([next]);
    setRedraws(0);
    setTheme("");
    setKept(false);
    filRecordedFor.current = null;
  }

  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720} compactTop>
      <ScreenNavBar backLabel={t("nav.back")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("oneRule.heroLabel")}
        title={t("oneRule.heroTitle")}
        accent={t("oneRule.heroAccent")}
        description={t("oneRule.heroDescription")}
        className="mb-6"
      />

      <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-6 mb-6">
        <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
          {t("oneRule.ruleLabel")}
        </Text>
        <Text className={`text-xl font-light leading-8 ${textPrimary(isDark)}`}>
          {ruleLabel}
        </Text>
        <Text className={`text-xs mt-3 leading-5 ${textMuted(isDark)}`}>
          {t("oneRule.redrawStatus", {
            remaining: remainingRedraws,
            max: ONE_RULE_MAX_REDRAWS,
          })}
        </Text>
      </View>

      {!kept ? (
        <View className="gap-3 mb-8">
          <PrimaryButton label={t("oneRule.keep")} onPress={handleKeep} />
          <PrimaryButton
            label={
              remainingRedraws > 0
                ? t("oneRule.redraw")
                : t("oneRule.redrawExhausted")
            }
            onPress={handleRedraw}
            variant="secondary"
            disabled={remainingRedraws <= 0}
          />
        </View>
      ) : (
        <View className="mb-8">
          <Text className={`text-sm font-medium mb-2 ${textSecondary(isDark)}`}>
            {t("oneRule.themeLabel")}
          </Text>
          <TextInput
            className={`rounded-2xl border border-sand-200 px-4 py-3 text-base mb-2 ${
              isDark ? "bg-sand-900 text-sand-100" : "bg-white text-sand-800"
            }`}
            placeholder={t("oneRule.themePlaceholder")}
            placeholderTextColor="#A89F91"
            value={theme}
            onChangeText={setTheme}
            maxLength={80}
          />
          <Text className={`text-xs mb-6 leading-5 ${textMuted(isDark)}`}>
            {t("oneRule.themeHint")}
          </Text>

          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-4 mb-4">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              {t("oneRule.impulseTitle")}
            </Text>
            <Text className="text-sand-800 text-lg font-light leading-7">
              {impulse}
            </Text>
          </View>

          <AmorceOutcomePanel
            impulse={impulse}
            moduleStatement={moduleStatement}
          />

          <View className="mt-4">
            <PrimaryButton
              label={t("oneRule.restart")}
              onPress={handleRestart}
              variant="ghost"
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
